"use client";

import { useAppSettings } from "@/components/settings-context";
import { NoReadwiseAccessToken } from "@/components/no-readwise-access-token";
import {
  fetchDocumentListApi,
  ReadwiseDocument,
} from "@/hooks/use-readwise-data";
import { toast } from "sonner";

export default function Home() {
  const { settings, updateSettings } = useAppSettings();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfYear(new Date()),
    to: endOfToday(),
  });

  const handleSelectAction = (date: DateRange | undefined) => {
    setDateRange(date);
  };

  const readArticles = useMemo(() => {
    return settings.data.filter((document) => document.location === "archive")
      .length;
  }, [settings]);

  const [chartData, overallDifference] = useMemo(() => {
    // Create the last 6 months of data with "MMMM yyyy" format
    const chartData: {
      month: string;
      articlesAdded: number;
      articlesRead: number;
    }[] = [];

    for (let i = 5; i >= 0; i--) {
      const month = subMonths(new Date(), i);
      chartData.push({
        month: format(month, "MMMM yyyy"), // Use "MMMM yyyy" here
        articlesAdded: 0,
        articlesRead: 0,
      });
    }

    let articlesAddedOverall = 0;
    let articlesReadOverall = 0;
    for (let i = 0; i < settings.data.length; i++) {
      const document = settings.data[i];
      if (document.location === "later") {
        const month = new Date(document.saved_at);
        const monthLabel = format(month, "MMMM yyyy"); // Match above formatting
        const monthIndex = chartData.findIndex(
          (item) => item.month === monthLabel,
        );

        if (monthIndex !== -1) {
          chartData[monthIndex].articlesAdded++;
          articlesAddedOverall++;
        }
      } else if (document.location === "archive") {
        const month = new Date(document.last_moved_at);
        const monthLabel = format(month, "MMMM yyyy"); // Match above formatting
        const monthIndex = chartData.findIndex(
          (item) => item.month === monthLabel,
        );

        if (monthIndex !== -1) {
          chartData[monthIndex].articlesRead++;
          articlesReadOverall++;
        }
      }
    }

    const overallDifference = articlesAddedOverall - articlesReadOverall;

    return [chartData, overallDifference];
  }, [settings]);

  const readArticlesThisYear = useMemo(() => {
    return settings.data.filter(
      (document) =>
        document.location === "archive" &&
        getYear(new Date(document.last_moved_at)) === getYear(new Date()),
    ).length;
  }, [settings]);

  const [refreshingData, setRefreshingData] = useState(false);

  if (!settings.readwiseAccessToken) {
    return <NoReadwiseAccessToken />;
  }

  function refreshData() {
    async function fetchData() {
      try {
        setRefreshingData(true);

        const data = await fetchDocumentListApi(settings.readwiseAccessToken);

        updateSettings({
          ...settings,
          data: data,
        });

        setRefreshingData(false);

        toast.success("Data refreshed.");
      } catch (
        error: any // eslint-disable-line @typescript-eslint/no-explicit-any
      ) {
        toast.error(`Error: ${error.message}`);
      }
    }

    fetchData();
  }

  return (
    <div className="p-8 flex flex-col gap-8">
      <div className="w-full flex gap-4">
        <h2 className="flex-grow scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          Your Readwise Reader Stats
        </h2>
        <Button className="w-36" onClick={refreshData}>
          <RefreshCw className={`${refreshingData ? "animate-spin" : null}`} />
          {refreshingData ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>
      <div className="flex gap-4">
        <ReadArticles articleCount={readArticles} />
        <ReadArticlesThisYear articleCount={readArticlesThisYear} />
        <div className="w-96">
          <MonthlyChart
            chartData={chartData}
            overallDifference={overallDifference}
          />
        </div>
      </div>
      <Separator />
      <DatePickerWithRange
        date={dateRange}
        onSelectAction={handleSelectAction} // Updated to match the prop name in DatePickerWithRangeProps
        className="my-custom-class" // Optional: add a custom class
      />
      <CustomRangeStats data={settings.data} dateRange={dateRange} />
    </div>
  );
}

interface CustomRangeStatsProps {
  data: ReadwiseDocument[];
  dateRange: DateRange | undefined;
}

function CustomRangeStats({ data, dateRange }: CustomRangeStatsProps) {
  const [articlesAdded, articlesRead] = useMemo(() => {
    if (!dateRange || !dateRange.from || !dateRange.to) {
      return [0, 0];
    }

    let articlesAdded = 0;
    let articlesRead = 0;

    for (let i = 0; i < data.length; i++) {
      const document = data[i];
      if (
        document.location === "later" &&
        new Date(document.saved_at) >= dateRange?.from &&
        new Date(document.saved_at) <= dateRange?.to
      ) {
        articlesAdded++;
      } else if (
        document.location === "archive" &&
        new Date(document.last_moved_at) >= dateRange?.from &&
        new Date(document.last_moved_at) <= dateRange?.to
      ) {
        articlesRead++;
      }
    }

    return [articlesAdded, articlesRead];
  }, [data, dateRange]);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Articles in Custom Range</CardTitle>
          <CardDescription>
            The number of articles you added and read in the selected date
            range.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p>Added</p>
              <p>{articlesAdded}</p>
            </div>
            <div>
              <p>Read</p>
              <p>{articlesRead}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <CustomRangeChart data={data} dateRange={dateRange} />
    </div>
  );
}

function CustomRangeChart({ data, dateRange }: CustomRangeStatsProps) {
  const chartData = useMemo(() => {
    if (!dateRange || !dateRange.from || !dateRange.to) {
      return [];
    }

    // Generate all months between dateRange.from and dateRange.to
    const start = new Date(
      dateRange.from.getFullYear(),
      dateRange.from.getMonth(),
      1,
    );
    const end = new Date(
      dateRange.to.getFullYear(),
      dateRange.to.getMonth(),
      1,
    );

    const months = [];
    const current = new Date(start);
    while (current <= end) {
      months.push(format(current, "MMMM yyyy"));
      current.setMonth(current.getMonth() + 1);
    }

    // Initialize chartData structure
    const monthlyData = months.map((monthLabel) => ({
      month: monthLabel,
      articlesAdded: 0,
      articlesRead: 0,
    }));

    // Aggregate data
    for (let i = 0; i < data.length; i++) {
      const document = data[i];
      let docMonth,
        isInRange = false;

      if (document.location === "later") {
        const savedAt = new Date(document.saved_at);
        isInRange = savedAt >= dateRange.from && savedAt <= dateRange.to;
        docMonth = format(savedAt, "MMMM yyyy");
      } else if (document.location === "archive") {
        const archivedAt = new Date(document.last_moved_at);
        isInRange = archivedAt >= dateRange.from && archivedAt <= dateRange.to;
        docMonth = format(archivedAt, "MMMM yyyy");
      }

      if (isInRange && docMonth) {
        const monthIndex = monthlyData.findIndex((m) => m.month === docMonth);
        if (monthIndex !== -1) {
          if (document.location === "later") {
            monthlyData[monthIndex].articlesAdded++;
          } else if (document.location === "archive") {
            monthlyData[monthIndex].articlesRead++;
          }
        }
      }
    }

    return monthlyData;
  }, [data, dateRange]);

  if (
    !dateRange ||
    !dateRange.from ||
    !dateRange.to ||
    chartData.length === 0
  ) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Articles/Month in Selected Range</CardTitle>
        <CardDescription>
          {format(dateRange.from, "MMMM yyyy")} -{" "}
          {format(dateRange.to, "MMMM yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData} margin={{ top: 20 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => {
                // Show short month name + year abbreviation
                const [fullMonth, fullYear] = value.split(" ");
                return `${fullMonth.slice(0, 3)} '${fullYear.slice(-2)}`;
              }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="articlesAdded"
              fill="var(--color-articlesAdded)"
              radius={4}
            >
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
            <Bar
              dataKey="articlesRead"
              fill="var(--color-articlesRead)"
              radius={4}
            >
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ReadArticlesProps {
  articleCount: number | undefined;
}

function ReadArticles({ articleCount }: ReadArticlesProps) {
  if (articleCount === undefined) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Read articles total</CardTitle>
        <CardDescription>
          The total number of articles in your Reader Archive.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>{articleCount}</p>
      </CardContent>
    </Card>
  );
}

interface ReadArticlesProps {
  articleCount: number | undefined;
}

function ReadArticlesThisYear({ articleCount }: ReadArticlesProps) {
  if (articleCount === undefined) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Read articles {getYear(new Date())}</CardTitle>
        <CardDescription>
          The total number of articles you read this year.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>{articleCount}</p>
      </CardContent>
    </Card>
  );
}

import { Bar, BarChart, CartesianGrid, XAxis, LabelList } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { endOfToday, format, getYear, startOfYear, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/date-range-picker";
import { Separator } from "@/components/ui/separator";

const chartConfig = {
  articlesAdded: {
    label: "Added",
    color: "hsl(var(--chart-1))",
  },
  articlesRead: {
    label: "Read",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

interface MonthlyChartProps {
  chartData: {
    month: string;
    articlesAdded: number;
    articlesRead: number;
  }[];
  overallDifference: number | undefined;
}

function MonthlyChart({ chartData, overallDifference }: MonthlyChartProps) {
  if (chartData.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Articles/Month</CardTitle>
        <CardDescription>
          {format(subMonths(new Date(), 5), "MMMM")} -{" "}
          {format(new Date(), "MMMM yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="articlesAdded"
              fill="var(--color-articlesAdded)"
              radius={4}
            >
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
            <Bar
              dataKey="articlesRead"
              fill="var(--color-articlesRead)"
              radius={4}
            >
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="leading-none text-muted-foreground">
          Overall, you saved {overallDifference} more articles than you read
          during the last 6 months.
        </div>
      </CardFooter>
    </Card>
  );
}
