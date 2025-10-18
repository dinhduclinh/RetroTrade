"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/common/label"

const Form = React.createContext<{
  form: any
}>({
  form: null,
})

const FormField = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    control: any
    name: string
    render: (props: { field: any; fieldState: any; formState: any }) => React.ReactNode
  }
>(({ className, control, name, render, ...props }, ref) => {
  const field = control._formValues?.[name] || { value: "", onChange: () => {}, onBlur: () => {} }
  const fieldState = { error: null, isDirty: false, isTouched: false }
  const formState = { errors: {}, isSubmitting: false }

  return (
    <div ref={ref} className={cn("space-y-2", className)} {...props}>
      {render({ field, fieldState, formState })}
    </div>
  )
})
FormField.displayName = "FormField"

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("space-y-2", className)} {...props} />
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => {
  return (
    <Label
      ref={ref}
      className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("", className)} {...props} />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  if (!children) {
    return null
  }

  return (
    <p
      ref={ref}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {children}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}

function useFormField() {
  const fieldContext = React.useContext(Form)
  const itemContext = React.useContext(Form)
  const { getFieldState, formState } = fieldContext

  const fieldState = getFieldState?.(itemContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { name } = itemContext

  return {
    name,
    formItemId: `${name}-form-item`,
    formDescriptionId: `${name}-form-item-description`,
    formMessageId: `${name}-form-item-message`,
    ...fieldState,
  }
}
