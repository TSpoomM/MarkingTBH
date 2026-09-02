"use client";

import { Component } from "react";
import FilterPanel from "@/src/components/marking/FilterPanel";
import OrderTable from "@/src/components/marking/OrderTable";
import Pagination from "@/src/components/marking/Pagination";

export default class MarkingPage extends Component {
  render() {
    return (
      <>
        <FilterPanel />
        <OrderTable />
        <Pagination />
      </>
    );
  }
}
