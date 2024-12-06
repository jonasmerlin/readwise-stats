"use client";

import { useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAppSettings } from "@/components/settings-context";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

function getJsonSizeInKB(
  jsonObject: any, // eslint-disable-line @typescript-eslint/no-explicit-any
) {
  // Convert JSON object to a string
  const jsonString = JSON.stringify(jsonObject);

  // Calculate size in bytes
  const sizeInBytes = new Blob([jsonString]).size;

  // Convert bytes to kilobytes
  const sizeInKB = sizeInBytes / 1024;

  return sizeInKB.toFixed(2);
}

const formSchema = z.object({
  readwiseAccessToken: z
    .string()
    .min(2, { message: "Access token must be at least 2 characters long." })
    .max(50, { message: "Access token must not exceed 50 characters." }),
});

export default function Home() {
  const { settings, updateSettings } = useAppSettings();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      readwiseAccessToken: settings.readwiseAccessToken || "",
    },
  });

  // Sync form with external settings
  useEffect(() => {
    form.reset({
      readwiseAccessToken: settings.readwiseAccessToken || "",
    });
  }, [settings.readwiseAccessToken, form]);

  // Submit handler
  const onSubmit = useCallback(
    (values: z.infer<typeof formSchema>) => {
      updateSettings({
        ...settings,
        readwiseAccessToken: values.readwiseAccessToken,
      });

      toast.success("Settings saved.");
    },
    [settings, updateSettings],
  );

  // CSS constants for repeated classes
  const sectionClasses = "p-8 flex flex-col gap-8";
  const headerClasses =
    "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0";
  const formClasses = "space-y-8";
  const linkClasses = "text-blue-500 underline";

  return (
    <div className={sectionClasses}>
      <h2 className={headerClasses}>Settings</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className={formClasses}>
          <FormField
            control={form.control}
            name="readwiseAccessToken"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="readwiseAccessToken">
                  Readwise API Token
                </FormLabel>
                <FormControl>
                  <Input
                    id="readwiseAccessToken"
                    placeholder="zItXnz5..."
                    aria-describedby="readwise-access-token-description"
                    {...field}
                  />
                </FormControl>
                <FormDescription id="readwise-access-token-description">
                  Your personal Readwise API token. You can get one{" "}
                  <a
                    className={linkClasses}
                    href="https://readwise.io/access_token"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    here
                  </a>
                  .
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Save Settings</Button>
        </form>
      </Form>
      <div className="text-muted-foreground text-xs">
        Size of local data: {getJsonSizeInKB(settings)} KB
      </div>
    </div>
  );
}
