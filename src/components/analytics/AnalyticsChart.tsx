import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface ChartData {
  month: string;
  value: number;
}

interface AnalyticsChartProps {
  title: string;
  description: string;
  data: ChartData[];
  valueKey: string;
  color: string;
  formatValue?: (value: number) => string;
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  title,
  description,
  data,
  valueKey,
  color,
  formatValue = (value) => value.toString()
}) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;

  const getBarHeight = (value: number) => {
    if (range === 0) return 50; // Default height if all values are the same
    return ((value - minValue) / range) * 100 + 20; // 20% minimum height
  };

  const getChangeIndicator = () => {
    if (data.length < 2) return null;
    
    const current = data[data.length - 1].value;
    const previous = data[data.length - 2].value;
    const change = ((current - previous) / previous) * 100;
    
    if (isNaN(change)) return null;
    
    return (
      <div className="flex items-center space-x-1 text-sm">
        {change > 0 ? (
          <TrendingUp className="h-4 w-4 text-green-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-500" />
        )}
        <span className={change > 0 ? "text-green-500" : "text-red-500"}>
          {Math.abs(change).toFixed(1)}%
        </span>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {getChangeIndicator()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart */}
          <div className="flex items-end justify-between h-32 space-x-2">
            {data.map((item, index) => (
              <div key={index} className="flex flex-col items-center space-y-2 flex-1">
                <div
                  className="w-full rounded-t-sm transition-all duration-300 hover:opacity-80"
                  style={{
                    height: `${getBarHeight(item.value)}%`,
                    backgroundColor: color,
                    minHeight: '8px'
                  }}
                />
                <div className="text-xs text-muted-foreground text-center">
                  {item.month}
                </div>
              </div>
            ))}
          </div>
          
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-lg font-semibold">
                {formatValue(data.reduce((sum, item) => sum + item.value, 0))}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average</p>
              <p className="text-lg font-semibold">
                {formatValue(data.reduce((sum, item) => sum + item.value, 0) / data.length)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 