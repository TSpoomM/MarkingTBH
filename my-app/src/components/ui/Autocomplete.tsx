import { Component, useId, type ChangeEvent } from "react";
import type { AutocompleteProps } from "@/src/core/models/ui";
import Button from "./Button";
import Field from "./Field";
import Input from "./Input";
import cn from "@/src/core/ui/cn";
import { CONTROL_END_DIVIDER, CONTROL_END_SHELL, CONTROL_END_SLOT, CONTROL_WITH_END } from "@/src/core/ui/fields";
import { LISTBOX, LISTBOX_OPTION, LISTBOX_OPTION_ACTIVE, LISTBOX_OPTION_TEXT } from "@/src/core/ui/listbox";
import { ChevronDown, CircleOff } from "lucide-react";

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
    const { onChange, onSelectOption } = this.props;
    if (onSelectOption) {
      onSelectOption({ value: option.value, label: option.label });
      this.setState({ open: false, activeIndex: -1 });
      return;
    }
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
      onSelectOption: _onSelectOption,
      onFocus,
      onBlur,
      onKeyDown,
      generatedId,
      style,
      ...props
    } = this.props;
    void _onSelectOption;
    const filteredOptions = this.filteredOptions(options, maxOptions);
    const hasOptions = filteredOptions.length > 0;
    const listId = `${props.id ?? generatedId}-options`;
    const control = (
      <div className={CONTROL_END_SHELL}>
        <Input
          bare
          size={size}
          required={required}
          className={cn(CONTROL_WITH_END, className)}
          style={style}
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
        <span className={CONTROL_END_SLOT} data-control-end-slot>
          <span className={CONTROL_END_DIVIDER} aria-hidden="true" />
          <ChevronDown className="shrink-0" size={18} aria-hidden="true" />
        </span>
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
