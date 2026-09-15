import { Component, useId, type ChangeEvent } from "react";
import type { AutocompleteProps } from "@/src/core/models/ui";
import Button from "./Button";
import Field from "./Field";
import Input from "./Input";
import cn from "@/src/core/ui/cn";
import { LISTBOX, LISTBOX_OPTION, LISTBOX_OPTION_ACTIVE, LISTBOX_OPTION_TEXT } from "@/src/core/ui/listbox";
import { ChevronDown, CircleOff } from "lucide-react";

const AUTOCOMPLETE_WRAP =
  "group/autocomplete relative w-full min-w-0 " +
  "before:pointer-events-none before:absolute before:top-1/2 before:right-9 before:z-[1] " +
  "before:h-[min(28px,calc(100%-16px))] before:w-px before:-translate-y-1/2 before:bg-[#d7e4de] " +
  "before:transition-colors before:content-[''] " +
  "hover:before:bg-[#9bc4b4] focus-within:before:bg-[#9bc4b4] " +
  "has-[input:disabled]:before:opacity-45";

const AUTOCOMPLETE_CHEVRON =
  "pointer-events-none absolute top-1/2 right-3 z-[1] -translate-y-1/2 text-primary " +
  "transition-colors duration-150 " +
  "group-hover/autocomplete:text-primary-dark group-focus-within/autocomplete:text-primary-dark " +
  "group-has-[input:disabled]/autocomplete:opacity-45";

interface AutocompleteState {
  open: boolean;
  activeIndex: number;
}

type AutocompleteBaseProps = AutocompleteProps & { generatedId: string };
type NormalizedOption = { value: string; label: string; disabled: boolean };

class AutocompleteBase extends Component<AutocompleteBaseProps, AutocompleteState> {
  state: AutocompleteState = {
    open: false,
    activeIndex: -1,
  };

  private value() {
    return String(this.props.value ?? "");
  }

  private normalizeOptions(options: AutocompleteProps["options"]) {
    const seen = new Set<string>();
    return options.reduce<NormalizedOption[]>((items, option) => {
      const item = typeof option === "string"
        ? { value: option, label: option, disabled: false }
        : { value: option.value, label: option.label, disabled: option.disabled === true };
      if (!item.value || seen.has(item.value)) return items;
      seen.add(item.value);
      return [...items, item];
    }, []);
  }

  private filteredOptions(options: AutocompleteProps["options"], maxOptions: number) {
    const value = this.value().trim().toLowerCase();
    const normalizedOptions = this.normalizeOptions(options);
    if (!value) return normalizedOptions.slice(0, maxOptions);
    return normalizedOptions
      .filter((option) => option.label.toLowerCase().includes(value) || option.value.toLowerCase().includes(value))
      .slice(0, maxOptions);
  }

  private selectOption(option: NormalizedOption) {
    if (option.disabled) return;
    const { onChange } = this.props;
    const event = {
      target: { value: option.value },
      currentTarget: { value: option.value },
    } as ChangeEvent<HTMLInputElement>;
    onChange?.(event);
    this.setState({ open: false, activeIndex: -1 });
  }

  render() {
    const {
      label,
      hint,
      options,
      maxOptions = 20,
      bare = false,
      size = "md",
      required,
      className = "",
      onChange,
      onFocus,
      onBlur,
      onKeyDown,
      generatedId,
      style,
      ...props
    } = this.props;
    const filteredOptions = this.filteredOptions(options, maxOptions);
    const hasOptions = filteredOptions.length > 0;
    const listId = `${props.id ?? generatedId}-options`;
    const control = (
      <div className={AUTOCOMPLETE_WRAP}>
        <Input
          bare
          size={size}
          required={required}
          className={className}
          style={{ ...style, paddingRight: "46px" }}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={this.state.open && hasOptions}
          aria-controls={listId}
          onChange={(event) => {
            onChange?.(event);
            this.setState({ open: true, activeIndex: -1 });
          }}
          onFocus={(event) => {
            onFocus?.(event);
            this.setState({ open: true });
          }}
          onBlur={(event) => {
            onBlur?.(event);
            window.setTimeout(() => this.setState({ open: false, activeIndex: -1 }), 120);
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (!hasOptions) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              this.setState((current) => ({
                open: true,
                activeIndex: Math.min(current.activeIndex + 1, filteredOptions.length - 1),
              }));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              this.setState((current) => ({
                open: true,
                activeIndex: Math.max(current.activeIndex - 1, 0),
              }));
            }
            if (event.key === "Enter" && this.state.open && this.state.activeIndex >= 0) {
              event.preventDefault();
              this.selectOption(filteredOptions[this.state.activeIndex]);
            }
            if (event.key === "Escape") {
              this.setState({ open: false, activeIndex: -1 });
            }
          }}
          {...props}
        />
        <ChevronDown className={AUTOCOMPLETE_CHEVRON} size={18} aria-hidden="true" />
        {this.state.open && hasOptions && (
          <div className={LISTBOX} id={listId} role="listbox">
            {filteredOptions.map((option, index) => (
              <Button
                type="button"
                className={cn(LISTBOX_OPTION, index === this.state.activeIndex && LISTBOX_OPTION_ACTIVE)}
                role="option"
                aria-selected={index === this.state.activeIndex}
                disabled={option.disabled}
                onMouseDown={(event) => {
                  event.preventDefault();
                  this.selectOption(option);
                }}
                key={option.value}
              >
                <span className={LISTBOX_OPTION_TEXT}>{option.label}</span>
                {option.disabled && <CircleOff className="ml-auto shrink-0 text-[#8c4d55]" size={16} strokeWidth={2.6} aria-hidden="true" />}
              </Button>
            ))}
          </div>
        )}
      </div>
    );
    if (bare) return control;
    return <Field label={label} hint={hint} required={required} size={size}>{control}</Field>;
  }
}

export default function Autocomplete(props: AutocompleteProps) {
  const generatedId = useId();
  return <AutocompleteBase {...props} generatedId={`autocomplete-${generatedId}`} />;
}
