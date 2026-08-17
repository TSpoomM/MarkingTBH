"use client";

import { Component } from "react";
import FilterPanel from "./component/FilterPanel";
import Header from "./component/Header";
import OrderTable from "./component/OrderTable";
import Pagination from "./component/Pagination";

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
