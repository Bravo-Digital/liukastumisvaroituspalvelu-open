import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "For Developers - Liukasbotti",
  description: "Public API that returns a paginated list of unique slippery warnings, newest first.",
  openGraph: {
    title: "Warnings API - Liukasbotti",
    description: "Public API listing unique slippery warnings with pagination.",
    type: "article",
  },
  twitter: {
    card: "summary",
    title: "Warnings API - Liukasbotti",
    description: "Public API listing unique slippery warnings with pagination.",
  },
};
export default function WarningsApiDocsPage() {
  const sampleResponse = `{
  "warnings": [
    { "id": "3", "date": "27.12.2024", "time": "10:00", "area": "TEST" },
    { "id": "2", "date": "12.10.2024", "time": "12:00", "area": "TEST" },
    { "id": "urn:oid:2.49.0.1.246.0.0.2025.09.06.001", "date": "06.09.2025", "time": "10:00", "area": "HELSINKI" }
  ],
  "pagination": { "total": 3, "limit": 50, "offset": 0, "hasMore": false }
}`;

  const responseSchema = `{
  "warnings": [
    {
      "id": "string",
      "date": "DD.MM.YYYY", // derived from onset/effective time
      "time": "HH:mm",      // derived from onset/effective time
      "area": "string"
    }
  ],
  "pagination": {
    "total": number,
    "limit": number,
    "offset": number,
    "hasMore": boolean
  }
}`;

  const curlExample = `curl "https://www.liukasbotti.fi/api/warnings?limit=50&offset=0"`;

  const jsServerExample = `// Node/Next (server-side)
const res = await fetch("https://www.liukasbotti.fi/api/warnings?limit=25&offset=0", {
  cache: "no-store"
});
if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
const data = await res.json();
console.log(data.warnings, data.pagination);`;

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 space-y-8">
      {/* Title */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Warnings API</h1>
        <p className="text-muted-foreground">
          Returns a paginated list of <strong>unique</strong> warnings, ordered newest first.
        </p>
      </div>

      {/* Endpoint */}
      <Card>
        <CardHeader className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge className="font-mono">GET</Badge>
            <code className="rounded bg-muted px-2 py-1 text-sm break-all">/api/warnings</code>
            <Badge variant="secondary">Public</Badge>
          </div>
          <CardTitle className="text-xl">Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            This endpoint reads the <code>warnings</code> table, sorts rows by{" "}
            <code>created_at</code> (descending), deduplicates by <code>id</code>, then returns a
            page of results. Each item includes a display-ready <code>date</code> and{" "}
            <code>time</code> derived from the warning&apos;s onset/effective time, and the{" "}
            <code>area</code>.
          </p>
          <Alert>
            <AlertDescription className="text-sm">
              No filters are supported. Use <code>limit</code> and <code>offset</code> to paginate
              through all results.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Query params */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Query parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Name</TableHead>
                <TableHead className="w-[120px]">Type</TableHead>
                <TableHead className="w-[120px]">Default</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <code>limit</code>
                </TableCell>
                <TableCell>integer</TableCell>
                <TableCell>
                  <code>50</code>
                </TableCell>
                <TableCell>
                  Page size. The server caps it at <strong>100 max</strong>. (No minimum clamp is
                  applied.)
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <code>offset</code>
                </TableCell>
                <TableCell>integer</TableCell>
                <TableCell>
                  <code>0</code>
                </TableCell>
                <TableCell>
                  Number of items to skip (pagination). The server clamps this to{" "}
                  <strong>0 min</strong>.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Response */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Response schema</CardTitle>
        </CardHeader>
        <CardContent>
        <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm leading-6 font-mono whitespace-pre">
          <code>{responseSchema}</code>
        </pre>
          <p className="mt-3 text-sm text-muted-foreground">
            <strong>Note:</strong> <code>date</code> and <code>time</code> are human-friendly
            strings produced on the server. If you need raw timestamps (e.g., ISO 8601 for{" "}
            <code>onsetAt</code>/<code>expiresAt</code>), consider extending the API in a future
            version.
          </p>
        </CardContent>
      </Card>

      {/* Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="curl" className="w-full">
            <TabsList>
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="node">JavaScript (server)</TabsTrigger>
              <TabsTrigger value="sample">Sample response</TabsTrigger>
            </TabsList>

            <TabsContent value="curl" className="mt-4">
              <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm leading-6">
                <code>{curlExample}</code>
              </pre>
            </TabsContent>

            <TabsContent value="node" className="mt-4">
              <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm leading-6">
                <code>{jsServerExample}</code>
              </pre>
            </TabsContent>

            <TabsContent value="sample" className="mt-4">
              <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm leading-6">
                <code>{sampleResponse}</code>
              </pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Behavior details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Behavior details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Ordering by <code>created_at</code> (newest first), then deduplication by{" "}
              <code>id</code> using a server-side map.
            </li>
            <li>
              <code>date</code>/<code>time</code> come from the warning&apos;s onset/effective time.
            </li>
            <li>
              <code>area</code> falls back to an empty string if not present in the row.
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Errors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Errors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead>Example body</TableHead>
                <TableHead className="w-[220px]">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <code>500</code>
                </TableCell>
                <TableCell>
                  <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
                    <code>{`{ "error": "Failed to fetch warnings" }`}</code>
                  </pre>
                </TableCell>
                <TableCell>Unexpected server error.</TableCell>
              </TableRow>
            </TableBody>
          </Table>

            <Alert>
              <AlertDescription className="text-sm">
                <p className="mb-1">Bad inputs are coerced as follows:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><code>limit</code> is capped to <strong>100 max</strong></li>
                  <li><code>offset</code> is clamped to <strong>0 min</strong></li>
                  <li>No other validation is performed.</li>
                </ul>
              </AlertDescription>
            </Alert>

        </CardContent>
      </Card>
    </div>
  );
}
