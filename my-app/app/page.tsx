"use client";

import { Component } from "react";
import FilterPanel from "@/app/features/marking/components/FilterPanel";
import Header from "@/app/features/marking/components/Header";
import OrderTable from "@/app/features/marking/components/OrderTable";
import Pagination from "@/app/features/marking/components/Pagination";

export default class Page extends Component {
  render() {
    return (
      <>
        <Header />
        <FilterPanel />
        <OrderTable />
        <Pagination />
      </>
    );
  }
}
