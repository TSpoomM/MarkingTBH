"use client";

import { Component, createRef } from "react";

export default class AutoFitStickerText extends Component<{ text: string }, { fontSize: number }> {
  private readonly maxFontSize = 50 * (96 / 72);
  private readonly minFontSize = 5;
  private readonly maxVerifyPasses = 70;
  private readonly ref = createRef<HTMLParagraphElement>();
  private resizeObserver: ResizeObserver | undefined;

  state = { fontSize: this.maxFontSize };

  componentDidMount() {
    this.fit();
    window.addEventListener("beforeprint", this.fitNow);
    if (typeof ResizeObserver !== "undefined" && this.ref.current) {
      this.resizeObserver = new ResizeObserver(() => this.fit());
      this.resizeObserver.observe(this.ref.current);
      if (this.ref.current.parentElement) {
        this.resizeObserver.observe(this.ref.current.parentElement);
      }
    }
  }

  componentDidUpdate(previousProps: { text: string }) {
    if (previousProps.text !== this.props.text) this.fit();
  }

  componentWillUnmount() {
    window.removeEventListener("beforeprint", this.fitNow);
    this.resizeObserver?.disconnect();
  }

  private fitNow = () => {
    const element = this.ref.current;
    const parent = element?.parentElement;
    if (!element || !parent) return;

    let fontSize = this.maxFontSize;
    element.style.fontSize = `${fontSize}px`;

    const parentStyle = getComputedStyle(parent);
    const horizontalPadding = Number.parseFloat(parentStyle.paddingLeft) + Number.parseFloat(parentStyle.paddingRight);
    const verticalPadding = Number.parseFloat(parentStyle.paddingTop) + Number.parseFloat(parentStyle.paddingBottom);
    const availableWidth = Math.max(0, parent.clientWidth - horizontalPadding);
    const availableHeight = Math.max(0, parent.clientHeight - verticalPadding);

    for (let pass = 0; pass < this.maxVerifyPasses; pass += 1) {
      const widthRatio = availableWidth > 0 && element.scrollWidth > availableWidth
        ? availableWidth / element.scrollWidth
        : 1;
      const heightRatio = availableHeight > 0 && element.scrollHeight > availableHeight
        ? availableHeight / element.scrollHeight
        : 1;
      const fitRatio = Math.min(widthRatio, heightRatio);
      if (fitRatio >= 1 || fontSize <= this.minFontSize) break;

      fontSize = Math.max(this.minFontSize, Math.floor(fontSize * fitRatio) - 0.5);
      element.style.fontSize = `${fontSize}px`;
    }

    if (Math.abs(fontSize - this.state.fontSize) > 0.5) this.setState({ fontSize });
  };

  private fit = () => window.requestAnimationFrame(this.fitNow);

  render() {
    return (
      <p ref={this.ref} style={{ fontSize: `${this.state.fontSize}px` }}>
        {this.props.text}
      </p>
    );
  }
}
