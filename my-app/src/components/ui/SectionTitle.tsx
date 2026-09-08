"use client";

import { Component } from "react";
import cn from "@/src/core/ui/cn";
import type { SectionTitleProps } from "@/src/core/models/ui";

/**
 * Section heading with a number badge, shared by the marking and history pages
 * compact = the variant used in table heading bars (badge sized to its content, description hidden on small screens)
 */
export default class SectionTitle extends Component<SectionTitleProps> {
  render() {
    const { number, title, subtitle, compact = false } = this.props;
    return (
      <div className="flex items-start gap-4 max-bp700:gap-3">
        <span
          className={cn(
            "grid size-[42px] shrink-0 place-items-center rounded-lg bg-primary text-base font-black text-white max-bp700:size-9",
            compact && "h-[42px] w-auto min-w-[42px] px-3 whitespace-nowrap",
          )}
        >
          {number}
        </span>
        <div>
          <h2 className="m-0 text-[22px] font-extrabold leading-tight text-[#1f2d28] max-bp700:text-[20px]">
            {title}
          </h2>
          {subtitle && (
            <p
              className={cn(
                "m-0 mt-[5px] max-w-[720px] text-sm leading-[1.55] text-[#62736d] max-bp700:text-[14px]",
                compact && "max-bp600:hidden",
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
    );
  }
}
