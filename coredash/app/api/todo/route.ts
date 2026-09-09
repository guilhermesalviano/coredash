import { NextRequest, NextResponse } from "next/server";
import { formatResponse } from "@/lib/api-response";
import { createTodo, getTodos, updateTodo } from "@/features/todos/server/todo-service";
import type { CreateTodoInput, UpdateTodoInput } from "@/features/todos/types";

export async function GET(req: NextRequest) {
  const onlyUnchecked = ["1", "true", "yes"].includes(
    (req.nextUrl.searchParams.get("onlyUnchecked") ?? "").toLowerCase(),
  );
  try {
    return formatResponse(req, { message: "Todos data retrieved successfully", data: await getTodos(onlyUnchecked) });
  } catch {
    return NextResponse.json({ error: "Failed to retrieve todos data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const input = (await req.json()) as CreateTodoInput;
    if (!input.title?.trim()) return NextResponse.json({ error: "Todo title is required" }, { status: 400 });
    const data = await createTodo({ ...input, title: input.title.trim() });
    return formatResponse(req, { message: "Todos saved successfully", data });
  } catch {
    return NextResponse.json({ error: "Failed to save todos data" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const input = (await req.json()) as UpdateTodoInput;
    if (!input.id) return NextResponse.json({ error: "Todo ID is required" }, { status: 400 });
    await updateTodo(input);
    return formatResponse(req, { message: "Todo updated successfully", data: null });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Todo not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update todo" }, { status: 500 });
  }
}
