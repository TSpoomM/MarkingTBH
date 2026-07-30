"use client";

import { Component } from "react";
import FilterPanel from "./FilterPanel";
import Header from "./Header";
import OrderTable from "./OrderTable";
import Pagination from "./Pagination";

export default class MarkingPage extends Component {
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
