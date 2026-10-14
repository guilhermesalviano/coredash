package com.coredash.app.data.todo

import kotlinx.coroutines.flow.Flow
import java.time.LocalDate

class TodoRepository(private val dao: TodoDao) {

    fun observe(): Flow<List<TodoEntity>> = dao.observeAll()

    suspend fun add(todo: TodoEntity): Long = dao.insert(todo)

    suspend fun update(todo: TodoEntity) = dao.update(todo)

    suspend fun delete(todo: TodoEntity) = dao.delete(todo)

    suspend fun deleteById(id: Long) {
        dao.findById(id)?.let { dao.delete(it) }
    }

    suspend fun toggleComplete(id: Long) {
        val todo = dao.findById(id) ?: return
        val recurrence = Recurrence.from(todo.recurrence)

        if (!todo.completed && recurrence != Recurrence.NONE) {
            val from = todo.dueDate?.let(LocalDate::ofEpochDay) ?: LocalDate.now()
            val next = nextDueDate(from, recurrence) ?: return
            dao.update(todo.copy(dueDate = next.toEpochDay()))
        } else {
            dao.update(todo.copy(completed = !todo.completed))
        }
    }
}
