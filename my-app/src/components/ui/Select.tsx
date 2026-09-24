import {
  Children,
  Component,
  isValidElement,
  useId,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import type { SelectProps } from "@/src/core/models/ui";
import Field from "./Field";
import cn from "@/src/core/ui/cn";
import {
  CONTROL_END_DIVIDER, CONTROL_END_SHELL, CONTROL_END_SLOT, CONTROL_WITH_END, control as controlClass,
} from "@/src/core/ui/fields";
import {
  LISTBOX, LISTBOX_CHECK, LISTBOX_OPTION, LISTBOX_OPTION_ACTIVE, LISTBOX_OPTION_SELECTED,
  LISTBOX_OPTION_TEXT,
} from "@/src/core/ui/listbox";
import { Check, ChevronDown } from "lucide-react";
import Button from "./Button";

interface SelectState {
  open: boolean;
  activeIndex: number;
  selectedValue?: string;
}

type OptionProps = {
  value?: string | number | readonly string[];
  label?: string;
  disabled?: boolean;
  hidden?: boolean;
  children?: ReactNode;
};

type SelectOption = {
  value: string;
  label: string;
  disabled: boolean;
  hidden: boolean;
  key: string;
};

type SelectBaseProps = SelectProps & { generatedId: string };

class SelectBase extends Component<SelectBaseProps, SelectState> {
  state: SelectState = {
    open: false,
    activeIndex: -1,
  };

  private optionText(children: ReactNode): string {
    return Children.toArray(children).map((child) => {
      if (typeof child === "string" || typeof child === "number") return String(child);
      if (isValidElement<OptionProps>(child)) return this.optionText(child.props.children);
      return "";
    }).join("");
  }

  private options(): SelectOption[] {
    return Children.toArray(this.props.children).flatMap((child, index) => {
      if (!isValidElement<OptionProps>(child) || child.type !== "option") return [];
      const label = child.props.label ?? this.optionText(child.props.children);
      const value = child.props.value == null ? label : String(child.props.value);
      return [{
        value,
        label,
        disabled: Boolean(child.props.disabled),
        hidden: Boolean(child.props.hidden),
        key: child.key == null ? `${value}-${index}` : String(child.key),
      }];
    });
  }

  private currentValue(options: SelectOption[]) {
    if (this.props.value != null) return String(this.props.value);
    if (this.state.selectedValue != null) return this.state.selectedValue;
    if (this.props.defaultValue != null) return String(this.props.defaultValue);
    return options.find((option) => !option.disabled && !option.hidden)?.value ?? "";
  }

  private enabledOptions(options: SelectOption[]) {
    return options.filter((option) => !option.disabled && !option.hidden);
  }

  private setOpen(open: boolean, activeIndex?: number) {
    this.setState({ open, activeIndex: activeIndex ?? (open ? this.state.activeIndex : -1) });
  }

  private selectOption(option: SelectOption) {
    if (this.props.disabled || option.disabled) return;
    const event = {
      target: { value: option.value },
      currentTarget: { value: option.value },
    } as ChangeEvent<HTMLSelectElement>;
    this.props.onChange?.(event);
    this.setState({ open: false, activeIndex: -1, selectedValue: option.value });
  }

  private handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, options: SelectOption[], currentValue: string) {
    const enabledOptions = this.enabledOptions(options);
    if (!enabledOptions.length) return;

    const currentIndex = Math.max(0, enabledOptions.findIndex((option) => option.value === currentValue));
    const activeIndex = this.state.activeIndex >= 0 ? this.state.activeIndex : currentIndex;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.setState({ open: true, activeIndex: Math.min(activeIndex + 1, enabledOptions.length - 1) });
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      this.setState({ open: true, activeIndex: Math.max(activeIndex - 1, 0) });
    }
    if (event.key === "Home") {
      event.preventDefault();
      this.setState({ open: true, activeIndex: 0 });
    }
    if (event.key === "End") {
      event.preventDefault();
      this.setState({ open: true, activeIndex: enabledOptions.length - 1 });
    }
    if ((event.key === "Enter" || event.key === " ") && this.state.open) {
      event.preventDefault();
      this.selectOption(enabledOptions[activeIndex]);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.setState({ open: true, activeIndex: currentIndex });
    }
    if (event.key === "Escape") {
      this.setOpen(false);
    }
  }

  render() {
    const {
      label,
      hint,
      children,
      bare = false,
      size = "md",
      required,
      className = "",
      id,
      name,
      disabled,
      onBlur,
      onFocus,
      onKeyDown,
      "aria-label": ariaLabel,
      generatedId,
    } = this.props;
    const options = this.options();
    const currentValue = this.currentValue(options);
    const selectedOption = options.find((option) => option.value === currentValue);
    const enabledOptions = this.enabledOptions(options);
    const listId = `${id ?? generatedId}-options`;
    const activeOption = enabledOptions[this.state.activeIndex];
    const control = (
      <div
        className={cn(CONTROL_END_SHELL, "app-select-wrap block")}
        onBlur={(event) => {
          const wrapper = event.currentTarget;
          window.setTimeout(() => {
            if (!wrapper.contains(document.activeElement)) {
              this.setOpen(false);
            }
          }, 120);
        }}
      >
        <select
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full opacity-0"
          disabled={disabled}
          name={name}
          required={required}
          tabIndex={-1}
          value={currentValue}
          onChange={this.props.onChange ?? (() => undefined)}
        >
          {children}
        </select>
        <Button
          variant="ghost"
          id={id}
          type="button"
          className={cn(
            controlClass(size),
            "app-select flex w-full min-w-0 cursor-pointer appearance-none items-center justify-start text-left",
            CONTROL_WITH_END,
            "disabled:cursor-not-allowed",
            className,
          )}
          disabled={disabled}
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={this.state.open}
          aria-controls={listId}
          aria-activedescendant={activeOption ? `${listId}-${activeOption.key}` : undefined}
          aria-required={required}
          onFocus={(event) => {
            onFocus?.(event as unknown as React.FocusEvent<HTMLSelectElement>);
          }}
          onBlur={(event) => {
            onBlur?.(event as unknown as React.FocusEvent<HTMLSelectElement>);
          }}
          onClick={() => {
            const selectedIndex = Math.max(0, enabledOptions.findIndex((option) => option.value === currentValue));
            this.setState((current) => ({
              open: !current.open,
              activeIndex: current.open ? -1 : selectedIndex,
            }));
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event as unknown as React.KeyboardEvent<HTMLSelectElement>);
            this.handleKeyDown(event, options, currentValue);
          }}
        >
          <span className={LISTBOX_OPTION_TEXT}>{selectedOption?.label || "\u00a0"}</span>
        </Button>
        <span className={CONTROL_END_SLOT}>
          <span className={CONTROL_END_DIVIDER} aria-hidden="true" />
          <ChevronDown className="shrink-0" size={18} aria-hidden="true" />
        </span>
        {this.state.open && enabledOptions.length > 0 && (
          <div className={cn(LISTBOX, "[scrollbar-color:#9bc4b4_#f4faf7] [scrollbar-width:thin]")} id={listId} role="listbox">
            {options.filter((option) => !option.hidden).map((option) => {
              const enabledIndex = enabledOptions.findIndex((enabledOption) => enabledOption.key === option.key);
              const active = enabledIndex === this.state.activeIndex;
              const selected = option.value === currentValue;
              return (
                <Button
                  variant="ghost"
                  id={`${listId}-${option.key}`}
                  type="button"
                  className={cn(
                    LISTBOX_OPTION,
                    active && LISTBOX_OPTION_ACTIVE,
                    selected && LISTBOX_OPTION_SELECTED,
                  )}
                  disabled={option.disabled}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => {
                    if (enabledIndex >= 0) this.setState({ activeIndex: enabledIndex });
                  }}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    this.selectOption(option);
                  }}
                  key={option.key}
                >
                  <span className={LISTBOX_OPTION_TEXT}>{option.label}</span>
                  {selected && <Check className={LISTBOX_CHECK} size={16} strokeWidth={3} />}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    );
    if (bare) return control;
    return <Field label={label} hint={hint} required={required} size={size}>{control}</Field>;
  }
}

export default function Select(props: SelectProps) {
  const generatedId = useId();
  return <SelectBase {...props} generatedId={`select-${generatedId}`} />;
}
