import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaTruck,
  FaTools,
  FaFileAlt,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaCheckCircle,
} from "react-icons/fa";
import { getVehicles } from "../services/vehicleApi";
import type { Vehicle } from "../types/Vehicle";
import { getRtaDocuments } from "../services/rtaDocumentApi";
import type { RtaDocument } from "../types/RtaDocument";
import { getBreakdowns } from "../services/breakdownApi";
import { getFines } from "../services/fineApi";

const Dashboard = () => {

  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [rtaDocuments, setRtaDocuments] = useState<RtaDocument[]>([]);
  const [breakdownCount, setBreakdownCount] = useState(0);
  const [repairingCost, setRepairingCost] = useState(0);
  const [pendingFines, setPendingFines] = useState(0);

  const attentionRef = useRef<HTMLDivElement>(null);
  const isHoveringRef = useRef(false);

  const loadVehicles = async () => {
    try {
      const data = await getVehicles();
      setVehicles(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadRtaDocuments = async () => {
    try {
      const data = await getRtaDocuments();
      setRtaDocuments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadBreakdowns = async () => {
    try {
      const data = await getBreakdowns();
      setBreakdownCount(data.length);

      // Repairing Cost = total estimated amount across every breakdown
      // record (i.e. the same total shown in the Breakdown Register),
      // not just ones still awaiting approval.
      const totalRepairingCost = data.reduce(
        (sum, b) => sum + (Number(b.estimatedAmount) || 0),
        0
      );

      setRepairingCost(totalRepairingCost);
    } catch (err) {
      console.error(err);
    }
  };

  const loadFines = async () => {
    try {
      const data = await getFines();

      const fines = data.reduce(
        (sum, f) => sum + (Number(f.fineAmount) || 0),
        0
      );

      setPendingFines(fines);
    } catch (err) {
      console.error(err);
    }
  };

  const today = new Date();
  today.setHours(0,0,0,0);

  // Grouped by vehicle so a fleet with many vehicles doesn't produce a
  // separate row per expired document - each vehicle gets a single row
  // listing every document that needs attention.
  const { attentionList, expiredDocuments } = useMemo(() => {

    let expiredDocuments = 0;

    const grouped = new Map<
      string,
      {
        vehicleNo: string;
        site: string;
        items: { document: string; status: string; isExpired: boolean }[];
      }
    >();

    rtaDocuments.forEach((doc)=>{

      // Registration Date is a fixed one-time date, not a renewable
      // document, so it's excluded from the expiry attention list.
      const documents=[

        {name:"Insurance",date:doc.insuranceExpiry},
        {name:"Fitness",date:doc.fitnessExpiry},
        {name:"Permit",date:doc.permitExpiry},
        {name:"PUC",date:doc.pollutionExpiry},
        {name:"Road Tax",date:doc.taxExpiry}

      ];

      documents.forEach((d)=>{

        if(!d.date) return;

        const expiry=new Date(d.date);

        expiry.setHours(0,0,0,0);

        const diffDays=Math.floor(

          (expiry.getTime()-today.getTime())

          /(1000*60*60*24)

        );

        if(diffDays<0 || diffDays<=30){

          const key = doc.vehicleNo;

          if (!grouped.has(key)) {
            grouped.set(key, {
              vehicleNo: doc.vehicleNo,
              site: doc.site,
              items: [],
            });
          }

          const isExpired = diffDays < 0;

          grouped.get(key)!.items.push({
            document: d.name,
            status: isExpired ? "Expired" : `${diffDays} Days Left`,
            isExpired,
          });

          if (isExpired) {
            expiredDocuments++;
          }

        }

      });

    });

    const attentionList = Array.from(grouped.values()).sort((a, b) => {

      const aHasExpired = a.items.some((i) => i.isExpired);
      const bHasExpired = b.items.some((i) => i.isExpired);

      if (aHasExpired !== bHasExpired) return aHasExpired ? -1 : 1;

      return a.vehicleNo.localeCompare(b.vehicleNo);

    });

    return{

      attentionList,

      expiredDocuments

    };

  },[rtaDocuments]);

  useEffect(()=>{

    loadVehicles();

    loadRtaDocuments();

    loadBreakdowns();

    loadFines();

  },[]);

  useEffect(()=>{

    const container=attentionRef.current;

    if(!container || attentionList.length===0) return;

    let animationId:number;

    let atBottomPause=false;

    const scroll=()=>{

      if(atBottomPause) return;

      if(isHoveringRef.current){

        animationId=requestAnimationFrame(scroll);

        return;

      }

      const max=

      container.scrollHeight-container.clientHeight;

      if(container.scrollTop>=max-2){

        atBottomPause=true;

        setTimeout(()=>{

          container.scrollTop=0;

          atBottomPause=false;

          animationId=requestAnimationFrame(scroll);

        },1500);

        return;

      }

      container.scrollTop+=1;

      animationId=requestAnimationFrame(scroll);

    };

    animationId=requestAnimationFrame(scroll);

    return()=>cancelAnimationFrame(animationId);

  },[attentionList.length]);

  const goToVehicleDocuments = (vehicleNo: string) => {
    navigate(`/documents?vehicle=${encodeURIComponent(vehicleNo)}`);
  };

  const currencyFormatter = new Intl.NumberFormat("en-IN");

return (
    <div>
      <h1 className="mb-4">Dashboard</h1>

<div className="row g-4 row-cols-2 row-cols-md-3 row-cols-xl-5">

    <div className="col">

        <div
            className="card dashboard-card dashboard-card--vehicles"
            onClick={() => navigate("/vehicles")}
        >

            <div className="card-body">

                <div className="dashboard-icon"><FaTruck /></div>

                <div className="dashboard-title">
                    Total Vehicles
                </div>

                <h2>{vehicles.length}</h2>

            </div>

        </div>

    </div>

    <div className="col">

        <div
            className="card dashboard-card dashboard-card--breakdowns"
            onClick={() => navigate("/breakdowns")}
        >

            <div className="card-body">

                <div className="dashboard-icon"><FaTools /></div>

                <div className="dashboard-title">
                    Breakdowns
                </div>

                <h2>{breakdownCount}</h2>

            </div>

        </div>

    </div>

    <div className="col">

        <div
            className="card dashboard-card dashboard-card--docs"
            onClick={() => navigate("/documents")}
        >

            <div className="card-body">

                <div className="dashboard-icon"><FaFileAlt /></div>

                <div className="dashboard-title">
                    Expired Docs
                </div>

                <h2>{expiredDocuments}</h2>

            </div>

        </div>

    </div>

    <div className="col">

        <div
            className="card dashboard-card dashboard-card--cost"
            onClick={() => navigate("/breakdowns")}
        >

            <div className="card-body">

                <div className="dashboard-icon"><FaMoneyBillWave /></div>

                <div className="dashboard-title">
                    Repairing Cost
                </div>

                <h2>₹{currencyFormatter.format(repairingCost)}</h2>

            </div>

        </div>

    </div>

    <div className="col">

        <div
            className="card dashboard-card dashboard-card--fines"
            onClick={() => navigate("/fines")}
        >

            <div className="card-body">

                <div className="dashboard-icon"><FaExclamationTriangle /></div>

                <div className="dashboard-title">
                    Pending Fines
                </div>

                <h2>₹{currencyFormatter.format(pendingFines)}</h2>

            </div>

        </div>

    </div>

</div>

<div className="card mt-4">

    <div className="card-header attention-header d-flex justify-content-between align-items-center">

        <h5 className="mb-0">
            <FaExclamationTriangle /> Attention Required
        </h5>

        <span className="badge bg-light text-danger fs-6">
            {attentionList.length}
        </span>

    </div>

    <div className="card-body p-0">

        {attentionList.length === 0 ? (

            <div className="p-4">

                <h5 className="text-success mb-0">

                    <FaCheckCircle /> All vehicle documents are valid.

                </h5>

            </div>

        ) : (

            <div
    ref={attentionRef}
    className="attention-container"
    onMouseEnter={() => (isHoveringRef.current = true)}
    onMouseLeave={() => (isHoveringRef.current = false)}
>

                {attentionList.map((item) => (

                    <div
                        key={item.vehicleNo}
                        className="attention-row d-flex align-items-center justify-content-between px-4 py-3 border-bottom cursor-pointer"
                        onClick={() => goToVehicleDocuments(item.vehicleNo)}
                        title={`View ${item.vehicleNo} in RTA Documents`}
                    >

                        <div className="vehicle-col">
                            <FaTruck /> <strong>{item.vehicleNo}</strong>
                        </div>

                        <div className="site-col">
                            <FaMapMarkerAlt /> {item.site}
                        </div>

                        <div className="attention-docs-col">
                            {item.items.map((doc, idx) => (
                                <span
                                    key={idx}
                                    className={
                                        doc.isExpired
                                            ? "doc-chip doc-chip-expired"
                                            : "doc-chip doc-chip-expiring"
                                    }
                                >
                                    {doc.isExpired
                                        ? `🔴 ${doc.document}`
                                        : `🟠 ${doc.document} · ${doc.status}`}
                                </span>
                            ))}
                        </div>

                    </div>

                ))}

            </div>

        )}

    </div>

</div>

</div>
  );
};

export default Dashboard;
