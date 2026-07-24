import { Component } from "react";
import Alert, { type AlertProps } from "./Alert";

export default class Toast extends Component<AlertProps> {
  render() {
    return <Alert {...this.props} />;
  }
}
