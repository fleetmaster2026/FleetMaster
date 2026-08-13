/**
 * ============================================================================
 * FleetMaster RTA Reminder Service (SQLite Version)
 * ============================================================================
 *
 * Features
 * ---------------------------------------------------------------------------
 * ✓ SQLite Compatible
 * ✓ Daily RTA Scan
 * ✓ RC Reminder
 * ✓ Insurance Reminder
 * ✓ Fitness Reminder
 * ✓ Permit Reminder
 * ✓ Pollution Reminder
 * ✓ 30/15/7/3/1 Day Reminder Logic
 * ✓ Duplicate Prevention
 * ✓ Email Logging
 * ✓ Daily Summary
 * ✓ Cron Scheduler
 * ============================================================================
 */

'use strict';

const cron = require('node-cron');
const moment = require('moment');

const db = require('../database/db');

const mailService = require('./mailService');
const emailTemplate = require('./emailTemplate');
const emailSummary = require('./emailSummary');
const emailLogger = require('./emailLogger');

const REMINDER_DAYS = [30, 15, 7, 3, 1];

const DOCUMENTS = [

    {
        column: 'insuranceExpiry',
        title: 'Insurance'
    },

    {
        column: 'fitnessExpiry',
        title: 'Fitness'
    },

    {
        column: 'permitExpiry',
        title: 'Permit'
    },

    {
        column: 'pollutionExpiry',
        title: 'Pollution'
    }

];

class RTAReminderService {

    constructor() {

        this.summary = {

            totalVehicles: 0,

            totalAlerts: 0,

            emailsSent: 0,

            failedEmails: 0,

            skipped: 0,

            errors: [],

            siteDetails: []

        };

    }

    /**
     * SQLite Promise wrapper
     */

    query(sql, params = []) {

        return new Promise((resolve, reject) => {

            db.all(sql, params, (err, rows) => {

                if (err)
                    return reject(err);

                resolve(rows);

            });

        });

    }

    /**
     * SQLite INSERT wrapper
     */

    execute(sql, params = []) {

        return new Promise((resolve, reject) => {

            db.run(sql, params, function(err) {

                if (err)
                    return reject(err);

                resolve(this);

            });

        });

    }

    /**
     * Remaining days
     */

    getRemainingDays(date) {

        if (!date)
            return null;

        return moment(date, "YYYY-MM-DD")
            .startOf('day')
            .diff(
                moment().startOf('day'),
                'days'
            );

    }

    /**
     * Valid date?
     */

    isValidDate(date) {

        if (!date)
            return false;

        return moment(
            date,
            "YYYY-MM-DD",
            true
        ).isValid();

    }

    /**
     * Reminder day?
     * True for the 30/15/7/3/1-day countdown, AND for every day a
     * document has already expired (negative/zero remaining) - previously
     * an expired document never matched REMINDER_DAYS at all, so it
     * silently stopped generating reminders the moment it expired.
     */

    shouldSend(days) {

        return REMINDER_DAYS.includes(days) || days <= 0;

    }

    /**
     * Reset summary
     */

    resetSummary() {

        this.summary = {

            totalVehicles: 0,

            totalAlerts: 0,

            emailsSent: 0,

            failedEmails: 0,

            skipped: 0,

            errors: [],

            siteDetails: []

        };

    }

    /**
     * Get all vehicles with RTA documents
     */

    async getVehicles() {

    const sql = `

    SELECT

        r.vehicleNo,

        COALESCE(v.vehicleName, '') AS vehicleName,

        COALESCE(v.vehicleType, '') AS vehicleType,

        r.site,

        r.engineer,

        COALESCE(v.status, 'Active') AS status,

        r.registrationDate,

        r.insuranceExpiry,

        r.fitnessExpiry,

        r.permitExpiry,

        r.pollutionExpiry,

        r.taxExpiry,

        s.email,

        s.mobile,

        s.engineerName

    FROM (

        SELECT *
        FROM (
            SELECT *,
                   ROW_NUMBER() OVER (
                       PARTITION BY LOWER(TRIM(vehicleNo))
                       ORDER BY id DESC
                   ) rn
            FROM rta_documents
        )
        WHERE rn = 1

    ) r

    LEFT JOIN (

        SELECT *
        FROM (
            SELECT *,
                   ROW_NUMBER() OVER (
                       PARTITION BY LOWER(TRIM(vehicleNo))
                       ORDER BY id DESC
                   ) rn
            FROM vehicles
        )
        WHERE rn = 1

    ) v

    ON LOWER(TRIM(r.vehicleNo)) =
       LOWER(TRIM(v.vehicleNo))

    LEFT JOIN site_engineers s

    ON LOWER(TRIM(r.site)) =
       LOWER(TRIM(s.siteLocation))

    AND LOWER(TRIM(r.engineer)) =
        LOWER(TRIM(s.engineerName))

    ORDER BY r.vehicleNo

    `;

    return await this.query(sql);

}

    /**
     * Create reminder object
     */

    createReminder(vehicle, document, expiryDate, remaining) {

        return {

            vehicleNo: vehicle.vehicleNo,

            vehicleName: vehicle.vehicleName,

            vehicleType: vehicle.vehicleType,

            site: vehicle.site,

            engineer: vehicle.engineer,

            email: vehicle.email,

            mobile: vehicle.mobile,

            document,

            expiryDate,

            remaining

        };

    }

    /**
     * Scan every vehicle
     */

    async scanVehicles() {

        try {

            const vehicles = await this.getVehicles();

            this.summary.totalVehicles = vehicles.length;

            console.log(
                `Scanning ${vehicles.length} vehicles...`
            );

            // ── Group all vehicles by engineer email so each engineer
            //    receives ONE combined email listing all their vehicles. ──
            const engineerMap = new Map();

            for (const vehicle of vehicles) {

                const reminders =
                    this.collectReminders(vehicle);

                if (!reminders.length)
                    continue;

                // Key: email (or fall back to engineer name so
                // "no-email" vehicles are still counted individually)
                const key =
                    vehicle.email ||
                    `__noemail__${vehicle.engineer}__${vehicle.site}`;

                if (!engineerMap.has(key)) {

                    engineerMap.set(key, {
                        vehicle,   // first vehicle carries engineer/site/email
                        reminders: []
                    });

                }

                engineerMap
                    .get(key)
                    .reminders
                    .push(...reminders);

            }

            // Send one email per engineer
            for (const { vehicle, reminders } of engineerMap.values()) {

                await this.sendReminder(vehicle, reminders);

            }

        }

        catch (err) {

            console.error(err);

            this.summary.errors.push(err.message);

        }

    }


    /**
     * Collect all due reminders for a single vehicle (no email sending).
     */

    collectReminders(vehicle) {

        const reminders = [];

        for (const doc of DOCUMENTS) {

            const expiry = vehicle[doc.column];

            if (!this.isValidDate(expiry))
                continue;

            const remaining =
                this.getRemainingDays(expiry);

            if (!this.shouldSend(remaining))
                continue;

            reminders.push(

                this.createReminder(

                    vehicle,

                    doc.title,

                    expiry,

                    remaining

                )

            );

        }

        return reminders;

    }


    /**
     * Process one vehicle (kept for backwards-compat / manual calls)
     */

    async processVehicle(vehicle) {

        const reminders = this.collectReminders(vehicle);

        if (!reminders.length)
            return;

        await this.sendReminder(vehicle, reminders);

    }


    /**
     * Duplicate email check
     */

    async alreadySent(reminder) {

        const sql = `

        SELECT id

        FROM email_logs

        WHERE

        reminderDate = ?

        AND

        engineerEmail = ?

        LIMIT 1

        `;

        const rows =
            await this.query(sql, [

                moment().format("YYYY-MM-DD"),

                reminder.email

            ]);

        return rows.length > 0;

    }


    /**
     * Send reminder email
     */

    async sendReminder(vehicle, reminders) {

        try {

            if (!vehicle.email) {

                console.log(

                    `${vehicle.vehicleNo} has no email.`

                );

                this.summary.skipped++;

                this.summary.siteDetails.push({

                    site: vehicle.site,

                    engineer: vehicle.engineer,

                    vehicles: 1,

                    alerts: reminders.length,

                    status: "Mail Not Found"

                });

                return;

            }

            const duplicate =
                await this.alreadySent(reminders[0]);

            if (duplicate) {

                console.log(

                    `${vehicle.vehicleNo} already mailed today.`

                );

                this.summary.skipped++;

                this.summary.siteDetails.push({

                    site: vehicle.site,

                    engineer: vehicle.engineer,

                    vehicles: new Set(reminders.map(r => r.vehicleNo)).size,

                    alerts: reminders.length,

                    status: "Already Sent Today"

                });

                return;

            }

            const html =

                emailTemplate.generateReminderEmail(

                    vehicle,

                    reminders

                );

            // Build a readable vehicle list for the subject line
            const vehicleNos = [
                ...new Set(reminders.map(r => r.vehicleNo))
            ];

            const subjectVehicles =
                vehicleNos.length <= 3
                    ? vehicleNos.join(", ")
                    : `${vehicleNos.slice(0, 3).join(", ")} +${vehicleNos.length - 3} more`;

            await mailService.sendMail({

                to: vehicle.email,

                subject:

                `FleetMaster RTA Reminder - ${vehicle.engineer} (${subjectVehicles})`,

                html

            });

            await this.saveEmailLog(

                vehicle,

                reminders,

                "SUCCESS"

            );

            if (

                emailLogger &&

                emailLogger.logSuccess

            ) {

                await emailLogger.logSuccess({

                    vehicleNumber:
                    vehicle.vehicleNo,

                    recipient:
                    vehicle.email,

                    reminders

                });

            }

            const uniqueVehicleCount =
                new Set(reminders.map(r => r.vehicleNo)).size;

            this.summary.emailsSent++;

            this.summary.totalAlerts +=
                reminders.length;

            this.summary.siteDetails.push({

                site: vehicle.site,

                engineer: vehicle.engineer,

                vehicles: uniqueVehicleCount,

                alerts: reminders.length,

                status: "Success"

            });

            console.log(

                `Reminder sent : ${vehicle.vehicleNo}`

            );

        }

        catch (err) {

            console.error(err);

            this.summary.failedEmails++;

            this.summary.errors.push(

                err.message

            );

            this.summary.siteDetails.push({

                site: vehicle.site,

                engineer: vehicle.engineer,

                vehicles: 1,

                alerts: reminders.length,

                status: "Failed"

            });

            await this.saveEmailLog(

                vehicle,

                reminders,

                "FAILED"

            );

            if (

                emailLogger &&

                emailLogger.logFailure

            ) {

                await emailLogger.logFailure({

                    vehicleNumber:
                    vehicle.vehicleNo,

                    recipient:
                    vehicle.email,

                    error:
                    err.message

                });

            }

        }

    }


    /**
     * Save email log
     */

    async saveEmailLog(

        vehicle,

        reminders,

        status

    ) {

        const sql = `

        INSERT INTO email_logs (

            reminderDate,

            site,

            engineer,

            engineerEmail,

            vehicles,

            alerts,

            status,

            sentAt

        )

        VALUES (?,?,?,?,?,?,?,?)

        `;

        await this.execute(sql,[

            moment().format("YYYY-MM-DD"),

            vehicle.site,

            vehicle.engineer,

            vehicle.email,

            1,

            reminders.length,

            status,

            new Date().toISOString()

        ]);

    }

    /**
     * Aggregate the raw per-vehicle outcomes collected in
     * this.summary.siteDetails into one row per site/engineer,
     * for the admin summary table.
     */

    buildSiteSummaryRows() {

        const groups = new Map();

        for (const item of this.summary.siteDetails) {

            const key = `${item.site || "-"}||${item.engineer || "-"}`;

            if (!groups.has(key)) {

                groups.set(key, {

                    site: item.site,

                    engineer: item.engineer,

                    vehicles: 0,

                    alerts: 0,

                    statuses: new Set()

                });

            }

            const row = groups.get(key);

            row.vehicles += item.vehicles;

            row.alerts += item.alerts;

            row.statuses.add(item.status);

        }

        return Array.from(groups.values()).map((row) => ({

            site: row.site,

            engineer: row.engineer,

            vehicles: row.vehicles,

            alerts: row.alerts,

            status: Array.from(row.statuses).join(" / ")

        }));

    }

    /**
     * Send summary email
     */

    async sendDailySummary() {

        try {

            if (
                !process.env.RTA_ADMIN_EMAIL
            ) {

                console.log(
                    "RTA_ADMIN_EMAIL not set - skipping admin summary email."
                );

                return;

            }

            const rows = this.buildSiteSummaryRows();

            const html =

                emailSummary.generateSummary(
                    rows,
                    this.summary
                );

            await mailService.sendMail({

                to:
                process.env.RTA_ADMIN_EMAIL,

                subject:

                `FleetMaster RTA Daily Summary - ${moment().format("DD-MM-YYYY")}`,

                html

            });

            console.log(
                "Daily summary email sent."
            );

        }

        catch (err) {

            console.error(
                "Summary Error:",
                err.message
            );

        }

    }


    /**
     * Complete daily process
     */

    async runDailyProcess() {

        console.log("");

        console.log(
            "====================================="
        );

        console.log(
            "FleetMaster RTA Scan Started"
        );

        console.log(
            "====================================="
        );

        this.resetSummary();

        await this.scanVehicles();

        await this.sendDailySummary();

        console.log("");

        console.log(
            "====================================="
        );

        console.log(
            "FleetMaster RTA Scan Completed"
        );

        console.log(
            "====================================="
        );

        console.table(this.summary);

        return this.summary;

    }


    /**
     * Manual execution
     */

    async runNow() {

        return await this.runDailyProcess();

    }


    /**
     * Scheduler
     */

    startScheduler() {

        const cronTime =

            process.env.RTA_CRON_TIME ||

            "0 8 * * *"; // Every day, 8:00 AM

        cron.schedule(

            cronTime,

            async () => {

                console.log(

                    "Cron Triggered..."

                );

                try {

                    await this.runDailyProcess();

                }

                catch (err) {

                    console.error(

                        err

                    );

                }

            },

            {

                timezone:

                process.env.TIMEZONE ||

                "Asia/Kolkata"

            }

        );

        console.log("");

        console.log(
            "====================================="
        );

        console.log(
            "RTA Scheduler Started"
        );

        console.log(
            `Cron : ${cronTime}`
        );

        console.log(
            "====================================="
        );

    }


    /**
     * Health Check
     */

    healthCheck() {

        return {

            service:
                "RTAReminderService",

            status:
                "ACTIVE",

            scheduler:
                true,

            reminderDays:
                REMINDER_DAYS,

            generatedAt:
                new Date()

        };

    }

}

/**
 * Singleton Instance
 */

const rtaReminderService =
    new RTAReminderService();

module.exports =
    rtaReminderService;