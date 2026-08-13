const db = require("../database/db");

/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
*/

exports.getDashboard = (req, res) => {

    const dashboard = {};

    db.get(
        `
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END) AS active,
            SUM(CASE WHEN status!='Active' THEN 1 ELSE 0 END) AS inactive
        FROM vehicles
        `,
        [],
        (err, vehicleRow) => {

            if (err)
                return res.status(500).json(err);

            dashboard.vehicles = vehicleRow;

            db.get(
                `
                SELECT
                    COUNT(*) AS breakdowns
                FROM breakdowns
                `,
                [],
                (err2, breakdownRow) => {

                    if (err2)
                        return res.status(500).json(err2);

                    dashboard.breakdowns = breakdownRow.breakdowns;

                    db.get(
                        `
                        SELECT
                            COUNT(*) AS fines,
                            IFNULL(SUM(fineAmount),0) AS totalFineAmount
                        FROM fines
                        `,
                        [],
                        (err3, fineRow) => {

                            if (err3)
                                return res.status(500).json(err3);

                            dashboard.fines = fineRow;

                            db.get(
                                `
                                SELECT COUNT(*) AS expiringDocuments
                                FROM rta_documents
                                WHERE
                                    date(insuranceExpiry) <= date('now','+30 day')
                                    OR
                                    date(fitnessExpiry) <= date('now','+30 day')
                                    OR
                                    date(permitExpiry) <= date('now','+30 day')
                                    OR
                                    date(pollutionExpiry) <= date('now','+30 day')
                                    OR
                                    date(taxExpiry) <= date('now','+30 day')
                                `,
                                [],
                                (err4, rtaRow) => {

                                    if (err4)
                                        return res.status(500).json(err4);

                                    dashboard.rta = rtaRow;

                                    res.json(dashboard);

                                }
                            );

                        }
                    );

                }
            );

        }
    );

};


/*
|--------------------------------------------------------------------------
| Vehicle Report
|--------------------------------------------------------------------------
*/

exports.getVehicleReport = (req, res) => {

    const {

        search,

        site,

        type,

        status

    } = req.query;

    let sql = `

        SELECT

            vehicleNo,

            vehicleName,

            vehicleType,

            manufacturer,

            registeringRTO,

            fuelType,

            site,

            engineer,

            status

        FROM vehicles

        WHERE 1 = 1

    `;

    const params = [];

    if (search) {

        sql += `
        AND
        (
            vehicleNo LIKE ?
            OR
            vehicleName LIKE ?
        )
        `;

        params.push(`%${search}%`);
        params.push(`%${search}%`);

    }

    if (site) {

        sql += ` AND site = ?`;

        params.push(site);

    }

    if (type) {

        sql += ` AND vehicleType = ?`;

        params.push(type);

    }

    if (status) {

        sql += ` AND status = ?`;

        params.push(status);

    }

    sql += ` ORDER BY vehicleNo ASC`;

    db.all(sql, params, (err, rows) => {

        if (err)
            return res.status(500).json(err);

        res.json(rows);

    });

};
/*
|--------------------------------------------------------------------------
| RTA Report
|--------------------------------------------------------------------------
*/

exports.getRTAReport = (req, res) => {

    const {
        search,
        site,
        engineer,
        status
    } = req.query;

    let sql = `
        SELECT
            vehicleNo,
            site,
            engineer,
            registrationDate,
            insuranceExpiry,
            fitnessExpiry,
            permitExpiry,
            pollutionExpiry,
            taxExpiry,
            remarks
        FROM rta_documents
        WHERE 1 = 1
    `;

    const params = [];

    if (search) {
        sql += ` AND vehicleNo LIKE ?`;
        params.push(`%${search}%`);
    }

    if (site) {
        sql += ` AND site = ?`;
        params.push(site);
    }

    if (engineer) {
        sql += ` AND engineer = ?`;
        params.push(engineer);
    }

    sql += ` ORDER BY vehicleNo ASC`;

    db.all(sql, params, (err, rows) => {

        if (err)
            return res.status(500).json(err);

        const today = new Date();

        const data = rows
            .map(row => {

                const dates = [
                    row.insuranceExpiry,
                    row.fitnessExpiry,
                    row.permitExpiry,
                    row.pollutionExpiry,
                    row.taxExpiry
                ];

                let overallStatus = "Valid";

                for (const value of dates) {

                    if (!value)
                        continue;

                    const expiry = new Date(value);

                    const diff =
                        Math.ceil(
                            (expiry - today) /
                            (1000 * 60 * 60 * 24)
                        );

                    if (diff < 0) {

                        overallStatus = "Expired";
                        break;

                    }

                    if (diff <= 30 && overallStatus !== "Expired") {

                        overallStatus = "Expiring Soon";

                    }

                }

                return {
                    ...row,
                    overallStatus
                };

            })
            .filter(row => {

                if (!status)
                    return true;

                return row.overallStatus === status;

            });

        res.json(data);

    });

};

/*
|--------------------------------------------------------------------------
| Breakdown Report
|--------------------------------------------------------------------------
*/

exports.getBreakdownReport = (req, res) => {

    const {
        search,
        site,
        engineer,
        breakdownType
    } = req.query;

    let sql = `
        SELECT
            businessUnit,
            projectCode,
            vehicleNo,
            vehicleName,
            vehicleType,
            site,
            engineer,
            breakdownDate,
            breakdownDays,
            breakdownType,
            breakdownDescription,
            estimatedAmount,
            approvalStatus,
            remarks
        FROM breakdowns
        WHERE 1=1
    `;

    const params = [];

    if (search) {

        sql += `
            AND vehicleNo LIKE ?
        `;

        params.push(`%${search}%`);

    }

    if (site) {

        sql += ` AND site = ?`;

        params.push(site);

    }

    if (engineer) {

        sql += ` AND engineer = ?`;

        params.push(engineer);

    }

    if (breakdownType) {

        sql += ` AND breakdownType = ?`;

        params.push(breakdownType);

    }

    sql += `
        ORDER BY breakdownDate DESC
    `;

    db.all(sql, params, (err, rows) => {

        if (err)
            return res.status(500).json(err);

        res.json(rows);

    });

};
/*
|--------------------------------------------------------------------------
| Fine Report
|--------------------------------------------------------------------------
*/

exports.getFineReport = (req, res) => {

    const {
        search,
        site,
        engineer
    } = req.query;

    let sql = `
        SELECT
            vehicleNo,
            projectCode,
            site,
            engineer,
            fineDate,
            fineReason,
            fineAmount,
            requireFund,
            remarks
        FROM fines
        WHERE 1 = 1
    `;

    const params = [];

    if (search) {
        sql += ` AND vehicleNo LIKE ?`;
        params.push(`%${search}%`);
    }

    if (site) {
        sql += ` AND site = ?`;
        params.push(site);
    }

    if (engineer) {
        sql += ` AND engineer = ?`;
        params.push(engineer);
    }

    sql += ` ORDER BY fineDate DESC`;

    db.all(sql, params, (err, rows) => {

        if (err)
            return res.status(500).json(err);

        const totalFine = rows.reduce(
            (sum, row) => sum + (Number(row.fineAmount) || 0),
            0
        );

        res.json({
            totalRecords: rows.length,
            totalFineAmount: totalFine,
            data: rows
        });

    });

};


/*
|--------------------------------------------------------------------------
| Monthly Utilisation Report
|--------------------------------------------------------------------------
*/

exports.getMonthlyUtilisationReport = (req, res) => {

    const {
        month,
        site,
        engineer,
        vehicleNo
    } = req.query;

    let sql = `
        SELECT
            utilisationMonth,
            vehicleNo,
            projectCode,
            site,
            engineer,
            openingKm,
            closingKm,
            differenceKm,
            targetKm,
            kmUtilisation,
            openingHours,
            closingHours,
            differenceHours,
            targetHours,
            hoursUtilisation,
            remarks
        FROM monthly_utilisation
        WHERE 1 = 1
    `;

    const params = [];

    if (month) {
        sql += ` AND utilisationMonth = ?`;
        params.push(month);
    }

    if (site) {
        sql += ` AND site = ?`;
        params.push(site);
    }

    if (engineer) {
        sql += ` AND engineer = ?`;
        params.push(engineer);
    }

    if (vehicleNo) {
        sql += ` AND vehicleNo = ?`;
        params.push(vehicleNo);
    }

    sql += `
        ORDER BY utilisationMonth DESC,
                 vehicleNo ASC
    `;

    db.all(sql, params, (err, rows) => {

        if (err)
            return res.status(500).json(err);

        res.json(rows);

    });

};
/*
|--------------------------------------------------------------------------
| Site Report
|--------------------------------------------------------------------------
*/

exports.getSiteReport = (req, res) => {

    const {
        search,
        status
    } = req.query;

    let sql = `
        SELECT
            siteName,
            location,
            projectCode,
            status
        FROM sites
        WHERE 1 = 1
    `;

    const params = [];

    if (search) {

        sql += `
            AND
            (
                siteName LIKE ?
                OR
                location LIKE ?
                OR
                projectCode LIKE ?
            )
        `;

        params.push(`%${search}%`);
        params.push(`%${search}%`);
        params.push(`%${search}%`);

    }

    if (status) {

        sql += ` AND status = ?`;

        params.push(status);

    }

    sql += ` ORDER BY siteName ASC`;

    db.all(sql, params, (err, rows) => {

        if (err)
            return res.status(500).json(err);

        res.json(rows);

    });

};


/*
|--------------------------------------------------------------------------
| Engineer Report
|--------------------------------------------------------------------------
*/

exports.getEngineerReport = (req, res) => {

    const {
        search,
        site,
        status
    } = req.query;

    let sql = `
        SELECT
            engineerName,
            employeeCode,
            mobile,
            email,
            designation,
            site,
            status
        FROM engineers
        WHERE 1 = 1
    `;

    const params = [];

    if (search) {

        sql += `
            AND
            (
                engineerName LIKE ?
                OR
                employeeCode LIKE ?
            )
        `;

        params.push(`%${search}%`);
        params.push(`%${search}%`);

    }

    if (site) {

        sql += ` AND site = ?`;

        params.push(site);

    }

    if (status) {

        sql += ` AND status = ?`;

        params.push(status);

    }

    sql += ` ORDER BY engineerName ASC`;

    db.all(sql, params, (err, rows) => {

        if (err)
            return res.status(500).json(err);

        res.json(rows);

    });

};