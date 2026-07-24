import { Component } from "react";

export default class EmptyState extends Component<{ message: string }> {
  render() {
    return <div className="empty-table">{this.props.message}</div>;
  }
}
