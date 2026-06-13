import React from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";

type Dataset = {
  label: string;
  data: number[];
  color?: string;
};

type ChartConfig = {
  type: "bar" | "line" | "pie" | "area";
  title?: string;
  labels: string[];
  datasets: Dataset[];
};

function chartColors(index: number): string {
  const palette = [
    "#d97706", "#2563eb", "#16a34a", "#dc2626",
    "#7c3aed", "#db2777", "#0891b2", "#ca8a04",
  ];
  return palette[index % palette.length];
}

export default function ChartBlock({ config }: { config: ChartConfig }) {
  if (!config?.type || !config?.labels || !config?.datasets) {
    return null;
  }

  const data = config.labels.map((label, i) => {
    const point: Record<string, string | number> = { name: label };
    config.datasets.forEach((ds) => {
      point[ds.label] = ds.data[i] ?? 0;
    });
    return point;
  });

  if (config.type === "pie") {
    const ds = config.datasets[0];
    const pieData = config.labels.map((label, i) => ({
      name: label,
      value: ds?.data[i] ?? 0,
    }));

    return (
      <div className="my-3">
        {config.title && (
          <p className="text-sm font-semibold text-center mb-1">{config.title}</p>
        )}
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ name, value }) => `${name}: ${value}`}
            >
              {pieData.map((_, idx) => (
                <Cell key={idx} fill={chartColors(idx)} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (config.type === "area") {
    return (
      <div className="my-3">
        {config.title && (
          <p className="text-sm font-semibold text-center mb-1">{config.title}</p>
        )}
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Legend />
            {config.datasets.map((ds, idx) => (
              <Area
                key={ds.label}
                type="monotone"
                dataKey={ds.label}
                stroke={ds.color || chartColors(idx)}
                fill={ds.color || chartColors(idx)}
                fillOpacity={0.15}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const ChartComponent = config.type === "line" ? LineChart : BarChart;
  const DataComponent = config.type === "line" ? Line : Bar;

  return (
    <div className="my-3">
      {config.title && (
        <p className="text-sm font-semibold text-center mb-1">{config.title}</p>
      )}
      <ResponsiveContainer width="100%" height={260}>
        <ChartComponent data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip />
          <Legend />
          {config.datasets.map((ds, idx) => (
            <DataComponent
              key={ds.label}
              type="monotone"
              dataKey={ds.label}
              fill={config.type === "bar" ? (ds.color || chartColors(idx)) : undefined}
              stroke={config.type === "line" ? (ds.color || chartColors(idx)) : undefined}
              fillOpacity={config.type === "bar" ? 0.85 : undefined}
            />
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}
