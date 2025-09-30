import * as React from "react";
import { cn } from "@/lib/utils";

export function SectionHeading({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "text-2xl sm:text-3xl font-semibold text-center mb-8 tracking-tight",
        className
      )}
      {...props}
    />
  );
}

export default SectionHeading;


