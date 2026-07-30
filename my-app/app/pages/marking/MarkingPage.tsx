"use client";

import FilterPanel from "./FilterPanel";
import Header from "./Header";
import OrderTable from "./OrderTable";
import Pagination from "./Pagination";

export default function MarkingPage() {
  return (
    <>
      <Header />
      <FilterPanel />
      <OrderTable />
      <Pagination />
    </>
  );
}
