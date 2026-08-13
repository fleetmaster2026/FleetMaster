import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";

const MainLayout = () => {

  return (

    <div className="main-layout">

      <Sidebar />

      <div className="layout-content">

        <Header />

        <main className="page-content">

          <Outlet />

        </main>

      </div>

    </div>

  );

};

export default MainLayout;