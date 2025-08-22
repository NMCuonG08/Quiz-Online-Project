"use client";
import React from "react";
import {
  Button,
  Label,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Switch,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/common/components/ui";
import { Div } from "@/common/components/ui/div";

const Test4 = () => {
  const [isEnabled, setIsEnabled] = React.useState(false);

  const users = [
    { id: 1, name: "Alice", email: "alice@example.com", role: "Admin" },
    { id: 2, name: "Bob", email: "bob@example.com", role: "Editor" },
    { id: 3, name: "Charlie", email: "charlie@example.com", role: "Viewer" },
  ];

  return (
    <div className="container mx-auto p-8 space-y-12">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Tabs</h2>
        <Tabs defaultValue="account" className="w-full">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>
          <div className="mt-4 rounded-lg border p-4">
            <TabsContent value="account">Account settings content.</TabsContent>
            <TabsContent value="password">Change password content.</TabsContent>
            <TabsContent value="billing">Billing details content.</TabsContent>
          </div>
        </Tabs>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Switch</h2>
        <div className="flex items-center gap-3">
          <Switch
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
            aria-label="Enable notifications"
          />
          <Label
            className="cursor-pointer"
            onClick={() => setIsEnabled((v) => !v)}
          >
            Notifications {isEnabled ? "On" : "Off"}
          </Label>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Sheet</h2>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Open Sheet</Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Quick Panel</SheetTitle>
              <SheetDescription>
                Useful quick actions and info.
              </SheetDescription>
            </SheetHeader>
            <div className="p-4 space-y-3">
              <Button className="w-full">Action 1</Button>
              <Button variant="secondary" className="w-full">
                Action 2
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Div variant="elevated" className="space-y-4 w-7xl">
        <h2 className="text-2xl font-bold">Table</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.id}</TableCell>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.role}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Div>
    </div>
  );
};

export default Test4;
