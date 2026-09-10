import { NextRequest, NextResponse } from "next/server";
import { formatResponse } from "@/lib/api-response";
import { createTodo, deleteTodo, getTodos, updateTodo } from "@/features/todos/server/todo-service";
import type { CreateTodoInput, TaskStatus, TodoType, UpdateTodoInput } from "@/features/todos/types";

export async function GET(req: NextRequest) {
  const onlyUnchecked = ["1", "true", "yes"].includes(
    (req.nextUrl.searchParams.get("onlyUnchecked") ?? "").toLowerCase(),
  );
  const rawType = req.nextUrl.searchParams.get("type")?.toLowerCase();
  const type: TodoType | "all" =
    rawType === "reminder" || rawType === "task" || rawType === "all"
      ? rawType
      : "all";

  const rawStatus = req.nextUrl.searchParams.get("status")?.toLowerCase();
  const status: TaskStatus | undefined =
    rawStatus === "backlog" ||
    rawStatus === "todo" ||
    rawStatus === "in_progress" ||
    rawStatus === "done"
      ? rawStatus
      : undefined;

  try {
    const data = await getTodos({ type, status, onlyUnchecked });
    return formatResponse(req, { message: "Todos data retrieved successfully", data });
  } catch {
    return NextResponse.json({ error: "Failed to retrieve todos data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const input = (await req.json()) as CreateTodoInput;
    if (!input.title?.trim()) return NextResponse.json({ error: "Todo title is required" }, { status: 400 });
    const data = await createTodo({ ...input, title: input.title.trim() });
    return formatResponse(req, { message: "Todo saved successfully", data });
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

export async function DELETE(req: NextRequest) {
  try {
    const idParam = req.nextUrl.searchParams.get("id");
    let id = idParam ? Number(idParam) : null;

    if (!id) {
      try {
        const body = (await req.json()) as { id?: number };
        if (body.id) id = Number(body.id);
      } catch {
        // Body was empty or not JSON
      }
    }

    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: "Valid Todo ID is required" }, { status: 400 });
    }

    await deleteTodo(id);
    return formatResponse(req, { message: "Todo deleted successfully", data: null });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Todo not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete todo" }, { status: 500 });
  }
}
