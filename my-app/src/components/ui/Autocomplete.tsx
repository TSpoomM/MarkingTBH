import { Component, useId, type ChangeEvent } from "react";
import type { AutocompleteProps } from "@/src/core/models/ui";
import Button from "./Button";
import Field from "./Field";
import Input from "./Input";
import cn from "@/src/core/ui/cn";
import { LISTBOX, LISTBOX_OPTION, LISTBOX_OPTION_ACTIVE, LISTBOX_OPTION_TEXT } from "@/src/core/ui/listbox";


interface AutocompleteState {
  open: boolean;
  activeIndex: number;
}

type AutocompleteBaseProps = AutocompleteProps & { generatedId: string };

class AutocompleteBase extends Component<AutocompleteBaseProps, AutocompleteState> {
  state: AutocompleteState = {
    open: false,
    activeIndex: -1,
  };

  private value() {
    return String(this.props.value ?? "");
  }

  private filteredOptions(options: string[], maxOptions: number) {
    const value = this.value().trim().toLowerCase();
    const uniqueOptions = Array.from(new Set(options.filter(Boolean)));
    if (!value) return uniqueOptions.slice(0, maxOptions);
    return uniqueOptions
      .filter((option) => option.toLowerCase().includes(value))
      .slice(0, maxOptions);
  }

  private selectOption(option: string) {
    const { onChange } = this.props;
    const event = {
      target: { value: option },
      currentTarget: { value: option },
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
      ...props
    } = this.props;
    const filteredOptions = this.filteredOptions(options, maxOptions);
    const hasOptions = filteredOptions.length > 0;
    const listId = `${props.id ?? generatedId}-options`;
    const control = (
      <div className="relative w-full min-w-0">
        <Input
          bare
          size={size}
          required={required}
          className={className}
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
        {this.state.open && hasOptions && (
          <div className={LISTBOX} id={listId} role="listbox">
            {filteredOptions.map((option, index) => (
              <Button
                type="button"
                className={cn(LISTBOX_OPTION, index === this.state.activeIndex && LISTBOX_OPTION_ACTIVE)}
                role="option"
                aria-selected={index === this.state.activeIndex}
                onMouseDown={(event) => {
                  event.preventDefault();
                  this.selectOption(option);
                }}
                key={option}
              >
                <span className={LISTBOX_OPTION_TEXT}>{option}</span>
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
