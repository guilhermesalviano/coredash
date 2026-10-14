package com.coredash.app.data.todo

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "todos")
data class TodoEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0L,
    val title: String,
    val priority: String = TodoEntity.PRIORITY_MEDIUM,
    val dueDate: Long? = null,
    val recurrence: String = Recurrence.NONE.name,
    val completed: Boolean = false,
    val createdAt: Long = System.currentTimeMillis(),
) {
    companion object {
        const val PRIORITY_LOW = "low"
        const val PRIORITY_MEDIUM = "medium"
        const val PRIORITY_HIGH = "high"
    }
}
