"use client";

import { Component } from "react";
import { templateManage, TemplateManageController } from "@/src/hooks/useTemplateManage";
import type { TemplateFormState } from "@/src/core/models/manage-template";

export default abstract class TemplateManageComponent<
  Props = Record<string, never>,
> extends Component<Props, TemplateFormState> {
  protected readonly actions: TemplateManageController = templateManage;
  private unsubscribe?: () => void;

  constructor(props: Props) {
    super(props);
    this.state = templateManage.getSnapshot();
  }

  componentDidMount() {
    this.unsubscribe = templateManage.subscribe(() => {
      this.setState(templateManage.getSnapshot());
    });
    void templateManage.initialize();
  }

  componentWillUnmount() {
    this.unsubscribe?.();
  }
}
