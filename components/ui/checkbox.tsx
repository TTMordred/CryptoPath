"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

// Original Checkbox component
export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

// Create a "safe" non-button checkbox that can be used inside buttons
// This uses a div instead of a button for the root element
interface SafeCheckboxProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const SafeCheckbox = React.forwardRef<HTMLDivElement, SafeCheckboxProps>(
  ({ className, onCheckedChange, checked, ...props }, ref) => {
  const [isChecked, setIsChecked] = React.useState(checked || false);
  
  React.useEffect(() => {
    setIsChecked(!!checked);
  }, [checked]);
  
  // Fix the type to explicitly use HTMLDivElement
  const handleClick = React.useCallback(() => {
    const newChecked = !isChecked;
    setIsChecked(newChecked);
    if (onCheckedChange) {
      onCheckedChange(newChecked);
    }
  }, [isChecked, onCheckedChange]);
  
  return (
    <div
      ref={ref}
      role="checkbox"
      aria-checked={isChecked}
      onClick={handleClick}
      className={cn(
        "h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        isChecked ? "bg-primary" : "bg-transparent",
        className
      )}
      {...props}
    >
      {isChecked && (
        <div className="flex items-center justify-center text-primary-foreground">
          <Check className="h-4 w-4" />
        </div>
      )}
    </div>
  );
});
SafeCheckbox.displayName = "SafeCheckbox";
