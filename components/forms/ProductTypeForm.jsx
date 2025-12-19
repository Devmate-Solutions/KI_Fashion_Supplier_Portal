"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";

const productTypeSchema = z.object({
  name: z.string().min(1, "Product type name is required").min(2, "Name must be at least 2 characters"),
});

const inputClasses = "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const textareaClasses = "flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const labelClasses = "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";

export default function ProductTypeForm({ onSubmit, onCancel, isSaving }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(productTypeSchema),
    defaultValues: {
      name: "",
    },
  });

  const submitHandler = handleSubmit((values) => {
    onSubmit(values);
    reset();
  });

  return (
    <form onSubmit={submitHandler} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className={labelClasses}>
          Product Type <span className="text-red-600">*</span>
        </label>
        <input
          id="name"
          type="text"
          className={`${inputClasses} ${errors.name ? 'border-red-500' : ''}`}
          placeholder="e.g: apparel, footwear, activewear"
          {...register("name")}
        />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting || isSaving}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || isSaving}>
          {isSaving ? "Creating..." : "Create Product Type"}
        </Button>
      </div>
    </form>
  );
}

