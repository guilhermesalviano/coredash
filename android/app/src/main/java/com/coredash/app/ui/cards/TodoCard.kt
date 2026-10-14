package com.coredash.app.ui.cards

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Checkbox
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MenuAnchorType
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import com.coredash.app.data.todo.Recurrence
import com.coredash.app.data.todo.TodoEntity
import java.time.LocalDate
import java.time.format.DateTimeFormatter

private val dateFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")

private val priorities: List<Pair<String, String>> = listOf(
    TodoEntity.PRIORITY_LOW to "Baixa",
    TodoEntity.PRIORITY_MEDIUM to "Média",
    TodoEntity.PRIORITY_HIGH to "Alta",
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TodoCard(
    todos: List<TodoEntity>,
    onToggleComplete: (Long) -> Unit,
    onDelete: (Long) -> Unit,
    onAdd: (title: String, priority: String, dueDate: LocalDate?, recurrence: Recurrence) -> Unit,
) {
    var showAddDialog by remember { mutableStateOf(false) }

    DashboardCard(title = "Tarefas") {
        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            if (todos.isEmpty()) {
                HintText("Nenhuma tarefa")
            }
            todos.forEach { todo ->
                TodoRow(
                    todo = todo,
                    onToggleComplete = onToggleComplete,
                    onDelete = onDelete,
                )
            }
            OutlinedButton(
                onClick = { showAddDialog = true },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Icon(imageVector = Icons.Default.Add, contentDescription = null)
                Spacer(modifier = Modifier.width(4.dp))
                Text("Nova tarefa")
            }
        }
    }

    if (showAddDialog) {
        AddTodoDialog(
            onDismiss = { showAddDialog = false },
            onConfirm = { title, priority, dueDate, recurrence ->
                onAdd(title, priority, dueDate, recurrence)
                showAddDialog = false
            },
        )
    }
}

@Composable
private fun TodoRow(
    todo: TodoEntity,
    onToggleComplete: (Long) -> Unit,
    onDelete: (Long) -> Unit,
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Checkbox(
            checked = todo.completed,
            onCheckedChange = { onToggleComplete(todo.id) },
        )
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = todo.title,
                style = MaterialTheme.typography.bodyMedium,
                textDecoration = if (todo.completed) TextDecoration.LineThrough else null,
            )
            TodoDetails(todo)
        }
        IconButton(onClick = { onDelete(todo.id) }) {
            Icon(
                imageVector = Icons.Default.Delete,
                contentDescription = "Excluir tarefa",
            )
        }
    }
}

@Composable
private fun TodoDetails(todo: TodoEntity) {
    val recurrence = Recurrence.from(todo.recurrence)
    val details = buildList {
        todo.dueDate?.let { add(LocalDate.ofEpochDay(it).format(dateFormatter)) }
        add(priorityLabel(todo.priority))
        if (recurrence != Recurrence.NONE) add(recurrenceLabel(recurrence))
    }.joinToString(" • ")
    if (details.isEmpty()) return
    Text(
        text = details,
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AddTodoDialog(
    onDismiss: () -> Unit,
    onConfirm: (title: String, priority: String, dueDate: LocalDate?, recurrence: Recurrence) -> Unit,
) {
    var title by remember { mutableStateOf("") }
    var priority by remember { mutableStateOf(TodoEntity.PRIORITY_MEDIUM) }
    var dueDateInput by remember { mutableStateOf("") }
    var recurrence by remember { mutableStateOf(Recurrence.NONE) }
    var expanded by remember { mutableStateOf(false) }

    val dueDate = dueDateInput.trim()
        .takeIf { it.isNotEmpty() }
        ?.let { runCatching { LocalDate.parse(it) }.getOrNull() }
    val dueDateError = dueDateInput.isNotBlank() && dueDate == null

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Nova tarefa") },
        text = {
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Título") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    priorities.forEach { (value, label) ->
                        FilterChip(
                            selected = priority == value,
                            onClick = { priority = value },
                            label = { Text(label) },
                        )
                    }
                }
                OutlinedTextField(
                    value = dueDateInput,
                    onValueChange = { dueDateInput = it },
                    label = { Text("Data de vencimento (opcional)") },
                    supportingText = { Text("Formato: aaaa-MM-dd") },
                    isError = dueDateError,
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                ExposedDropdownMenuBox(
                    expanded = expanded,
                    onExpandedChange = { expanded = it },
                ) {
                    OutlinedTextField(
                        value = recurrenceLabel(recurrence),
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Recorrência") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                        modifier = Modifier
                            .menuAnchor(MenuAnchorType.PrimaryNotEditable)
                            .fillMaxWidth(),
                    )
                    ExposedDropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false },
                    ) {
                        Recurrence.entries.forEach { option ->
                            DropdownMenuItem(
                                text = { Text(recurrenceLabel(option)) },
                                onClick = {
                                    recurrence = option
                                    expanded = false
                                },
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(
                enabled = title.isNotBlank() && !dueDateError,
                onClick = { onConfirm(title.trim(), priority, dueDate, recurrence) },
            ) { Text("Salvar") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancelar") }
        },
    )
}

private fun priorityLabel(priority: String): String =
    priorities.firstOrNull { it.first == priority }?.second ?: priorities[1].second

private fun recurrenceLabel(recurrence: Recurrence): String = when (recurrence) {
    Recurrence.NONE -> "Nenhuma"
    Recurrence.DAILY -> "Diária"
    Recurrence.WEEKLY -> "Semanal"
    Recurrence.MONTHLY -> "Mensal"
}
