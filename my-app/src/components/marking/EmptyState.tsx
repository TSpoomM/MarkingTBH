import { Component } from "react";

export default class EmptyState extends Component<{ message: string }> {
  render() {
    return (
      <div className="grid h-[110px] min-h-[150px] place-items-center rounded-lg border border-dashed border-[#b9c8c3] bg-[#fbfcfb] text-[16px] text-[#7f8e85]">
        {this.props.message}
      </div>
    );
  }
}
