import { NextRequest, NextResponse } from "next/server";
import { getDatabaseConnection } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { format, subDays } from "date-fns";
import { In, Like } from "typeorm";
import { Todo } from "@/entities/Todo";
import { TodoRecurrence } from "@/entities/TodoRecurrence";
import { TodoCheck } from "@/entities/TodoCheck";
import { createMemoryCache } from "@/utils/in-memory-cache";
import { TodoInternalAPIResponse } from "@/types/todo";
import { ONE_MINUTE_IN_MS } from "@/constants";
import { apiResponse } from "@/lib/api-response";
import logger from "@/lib/logger";

const PRIORITYWEIGHT: Record<string, number> = {
  high: 1,
  medium: 2,
  low: 3,
};

const todoCache = createMemoryCache<TodoInternalAPIResponse[]>(ONE_MINUTE_IN_MS * 60 * 1);

export async function GET(req: NextRequest) {
  const onlyUncheckedParam = req.nextUrl.searchParams.get("onlyUnchecked");
  const onlyUnchecked = ["1", "true", "yes"].includes((onlyUncheckedParam ?? "").toLowerCase());

  const cached = todoCache.get("default");
  if (cached) {
    logger.info("Todos data retrieved from cache successfully");
    const filteredCached = onlyUnchecked ? cached.filter((todo) => todo.checked === 0) : cached;
    return apiResponse(req, { message: "Todos data retrieved from cache", data: filteredCached });
  }

  try {
    const today = new Date();

    const db = await getDatabaseConnection();

    const todoRepository = db.getRepository(Todo);
    const todoCheckRepository = db.getRepository(TodoCheck);

    const todos = await todoRepository.find({
      where: [
        { createdAt: Like(`${format(today, "yyyy-MM-dd")}%`) as any },
        {
          recurrence: {
            repeat: 1,
            weeklyDays: Like(`%${today.getDay()}%`) as any,
          },
        },
      ],
      relations: ["recurrence"],
    });

    const todosFiltered = todos.filter((todo) => {
      const end = todo.recurrence?.weeklyEnd;
      if (end === null || end === undefined) return true;
      const respectLastDay = new Date(today);
      respectLastDay.setHours(0, 0, 0, 0);
      return Number(end) >= respectLastDay.getTime();
    });

    const sortedTodos = [...todosFiltered].sort((a, b) => {
      if (a.priority && b.priority) {
        const weightA = PRIORITYWEIGHT[a.priority.toLowerCase()] || 99;
        const weightB = PRIORITYWEIGHT[b.priority.toLowerCase()] || 99;

        if (weightA !== weightB) {
          return weightA - weightB;
        }

        if (PRIORITYWEIGHT[a.priority] == 1) return a.title.localeCompare(b.title);
      }

      if (a.priority && !b.priority) return -1;
      if (!a.priority && b.priority) return 1;

      return 0;
    });

    const checksResult = await todoCheckRepository.find({
      where: [
        {
          todo: In(sortedTodos.map(todo => todo.id)),
          timestamp: Like(`${format(today, "yyyy-MM-dd")}%`)
        }
      ],
      relations: ["todo"]
    });

    // refactor this to fetch all checks in one query
    const checksHistory = await todoCheckRepository.find({
      where: [
        {
          todo: In(sortedTodos.map(todo => todo.id)),
          timestamp: Like(`${format(subDays(today, 1), "yyyy-MM-dd")}%`)
        }
      ],
      relations: ["todo"]
    });

    const todosMapped = sortedTodos.map((todo) => {
      const check = checksResult.find(check => check.todo?.id === todo.id);
      const checkHistory = checksHistory.find(check => check.todo?.id === todo.id);

      return {
        id: todo.id,
        title: todo.title,
        checked: check?.checked ?? 0,
        priority: todo.priority ?? '',
        sponsor: todo.sponsor ?? '',
        usualCompletionTime: checkHistory?.hour ?? '' // data for AI.
      }
    });

    todoCache.set("default", todosMapped);

    const responseData = onlyUnchecked
      ? todosMapped.filter((todo) => todo.checked === 0)
      : todosMapped;

    return apiResponse(req, { message: "Todos data retrieved successfully", data: responseData });
  } catch (error: unknown) {
    console.error(error)
    return apiResponse(req, { error: "Failed to retrieve todos data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, checked, priority, repeat, weeklyInterval, weeklyDays, weeklyEnd } = body;

    const db = await getDatabaseConnection();

    const todoRecurrence = {
      repeat,
      weeklyInterval,
      weeklyDays,
      weeklyEnd
    }
    const todoRecurrenceRepository = db.getRepository(TodoRecurrence);
    const todoRecurrenceSaved = await todoRecurrenceRepository.save(todoRecurrence);

    const todo = {
      title,
      priority,
      createdAt: format(new Date(), "yyyy-MM-dd"),
      recurrence: todoRecurrenceSaved
    }

    const todoRepository = db.getRepository(Todo);
    const todoSaved = await todoRepository.save(todo);

    const todoCheck = {
      id: uuidv4(),
      timestamp: format(new Date(), "yyyy-MM-dd"),
      hour: format(new Date(), "HH:mm"),
      checked,
      todo: todoSaved
    }
    const todoCheckRepository = db.getRepository(TodoCheck);
    await todoCheckRepository.save(todoCheck);
    todoCache.clear();

    return NextResponse.json({ message: "Todos saved successfully", data: todoSaved }, { status: 200 })
  } catch (error: unknown) {
    console.error(error)
    return NextResponse.json({ error: "Failed to save todos data" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, checked } = body;

    if (!id) {
      return NextResponse.json({ error: "Todo ID is required" }, { status: 400 });
    }

    const db = await getDatabaseConnection();
    const todoRepository = db.getRepository(Todo);

    const todo = await todoRepository.findOne({
      where: { id },
    });

    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    const todoCheckRepository = db.getRepository(TodoCheck);
    const isChecked = await todoCheckRepository.findOne({
      where: { todo: { id }, timestamp: format(new Date(), "yyyy-MM-dd") },
      relations: ["todo"]
    });

    if (isChecked) {
      await todoCheckRepository.update({ id: isChecked.id }, { checked, hour: format(new Date(), "HH:mm") });
    } else {
      await todoCheckRepository.save({
        id: uuidv4(),
        timestamp: format(new Date(), "yyyy-MM-dd"),
        hour: format(new Date(), "HH:mm"),
        checked,
        todo: todo
      });
    }
    todoCache.clear();

    return NextResponse.json({ message: "Todo updated successfully", data: isChecked }, { status: 200 });
  } catch (error: unknown) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: "Failed to update todo" }, { status: 500 });
  }
}