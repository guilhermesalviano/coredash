package com.coredash.app.data.todo;

import android.database.Cursor;
import android.os.CancellationSignal;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.room.CoroutinesRoom;
import androidx.room.EntityDeletionOrUpdateAdapter;
import androidx.room.EntityInsertionAdapter;
import androidx.room.RoomDatabase;
import androidx.room.RoomSQLiteQuery;
import androidx.room.SharedSQLiteStatement;
import androidx.room.util.CursorUtil;
import androidx.room.util.DBUtil;
import androidx.sqlite.db.SupportSQLiteStatement;
import java.lang.Class;
import java.lang.Exception;
import java.lang.Long;
import java.lang.Object;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import javax.annotation.processing.Generated;
import kotlin.Unit;
import kotlin.coroutines.Continuation;
import kotlinx.coroutines.flow.Flow;

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class TodoDao_Impl implements TodoDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<TodoEntity> __insertionAdapterOfTodoEntity;

  private final EntityDeletionOrUpdateAdapter<TodoEntity> __deletionAdapterOfTodoEntity;

  private final EntityDeletionOrUpdateAdapter<TodoEntity> __updateAdapterOfTodoEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAll;

  public TodoDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfTodoEntity = new EntityInsertionAdapter<TodoEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `todos` (`id`,`title`,`priority`,`dueDate`,`recurrence`,`completed`,`createdAt`) VALUES (nullif(?, 0),?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final TodoEntity entity) {
        statement.bindLong(1, entity.getId());
        statement.bindString(2, entity.getTitle());
        statement.bindString(3, entity.getPriority());
        if (entity.getDueDate() == null) {
          statement.bindNull(4);
        } else {
          statement.bindLong(4, entity.getDueDate());
        }
        statement.bindString(5, entity.getRecurrence());
        final int _tmp = entity.getCompleted() ? 1 : 0;
        statement.bindLong(6, _tmp);
        statement.bindLong(7, entity.getCreatedAt());
      }
    };
    this.__deletionAdapterOfTodoEntity = new EntityDeletionOrUpdateAdapter<TodoEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "DELETE FROM `todos` WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final TodoEntity entity) {
        statement.bindLong(1, entity.getId());
      }
    };
    this.__updateAdapterOfTodoEntity = new EntityDeletionOrUpdateAdapter<TodoEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `todos` SET `id` = ?,`title` = ?,`priority` = ?,`dueDate` = ?,`recurrence` = ?,`completed` = ?,`createdAt` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final TodoEntity entity) {
        statement.bindLong(1, entity.getId());
        statement.bindString(2, entity.getTitle());
        statement.bindString(3, entity.getPriority());
        if (entity.getDueDate() == null) {
          statement.bindNull(4);
        } else {
          statement.bindLong(4, entity.getDueDate());
        }
        statement.bindString(5, entity.getRecurrence());
        final int _tmp = entity.getCompleted() ? 1 : 0;
        statement.bindLong(6, _tmp);
        statement.bindLong(7, entity.getCreatedAt());
        statement.bindLong(8, entity.getId());
      }
    };
    this.__preparedStmtOfDeleteAll = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM todos";
        return _query;
      }
    };
  }

  @Override
  public Object insert(final TodoEntity todo, final Continuation<? super Long> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Long>() {
      @Override
      @NonNull
      public Long call() throws Exception {
        __db.beginTransaction();
        try {
          final Long _result = __insertionAdapterOfTodoEntity.insertAndReturnId(todo);
          __db.setTransactionSuccessful();
          return _result;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object delete(final TodoEntity todo, final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __deletionAdapterOfTodoEntity.handle(todo);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object update(final TodoEntity todo, final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __updateAdapterOfTodoEntity.handle(todo);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteAll(final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final SupportSQLiteStatement _stmt = __preparedStmtOfDeleteAll.acquire();
        try {
          __db.beginTransaction();
          try {
            _stmt.executeUpdateDelete();
            __db.setTransactionSuccessful();
            return Unit.INSTANCE;
          } finally {
            __db.endTransaction();
          }
        } finally {
          __preparedStmtOfDeleteAll.release(_stmt);
        }
      }
    }, $completion);
  }

  @Override
  public Flow<List<TodoEntity>> observeAll() {
    final String _sql = "SELECT * FROM todos ORDER BY completed ASC, dueDate ASC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return CoroutinesRoom.createFlow(__db, false, new String[] {"todos"}, new Callable<List<TodoEntity>>() {
      @Override
      @NonNull
      public List<TodoEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTitle = CursorUtil.getColumnIndexOrThrow(_cursor, "title");
          final int _cursorIndexOfPriority = CursorUtil.getColumnIndexOrThrow(_cursor, "priority");
          final int _cursorIndexOfDueDate = CursorUtil.getColumnIndexOrThrow(_cursor, "dueDate");
          final int _cursorIndexOfRecurrence = CursorUtil.getColumnIndexOrThrow(_cursor, "recurrence");
          final int _cursorIndexOfCompleted = CursorUtil.getColumnIndexOrThrow(_cursor, "completed");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final List<TodoEntity> _result = new ArrayList<TodoEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final TodoEntity _item;
            final long _tmpId;
            _tmpId = _cursor.getLong(_cursorIndexOfId);
            final String _tmpTitle;
            _tmpTitle = _cursor.getString(_cursorIndexOfTitle);
            final String _tmpPriority;
            _tmpPriority = _cursor.getString(_cursorIndexOfPriority);
            final Long _tmpDueDate;
            if (_cursor.isNull(_cursorIndexOfDueDate)) {
              _tmpDueDate = null;
            } else {
              _tmpDueDate = _cursor.getLong(_cursorIndexOfDueDate);
            }
            final String _tmpRecurrence;
            _tmpRecurrence = _cursor.getString(_cursorIndexOfRecurrence);
            final boolean _tmpCompleted;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfCompleted);
            _tmpCompleted = _tmp != 0;
            final long _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getLong(_cursorIndexOfCreatedAt);
            _item = new TodoEntity(_tmpId,_tmpTitle,_tmpPriority,_tmpDueDate,_tmpRecurrence,_tmpCompleted,_tmpCreatedAt);
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
        }
      }

      @Override
      protected void finalize() {
        _statement.release();
      }
    });
  }

  @Override
  public Object findById(final long id, final Continuation<? super TodoEntity> $completion) {
    final String _sql = "SELECT * FROM todos WHERE id = ? LIMIT 1";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, id);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<TodoEntity>() {
      @Override
      @Nullable
      public TodoEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfTitle = CursorUtil.getColumnIndexOrThrow(_cursor, "title");
          final int _cursorIndexOfPriority = CursorUtil.getColumnIndexOrThrow(_cursor, "priority");
          final int _cursorIndexOfDueDate = CursorUtil.getColumnIndexOrThrow(_cursor, "dueDate");
          final int _cursorIndexOfRecurrence = CursorUtil.getColumnIndexOrThrow(_cursor, "recurrence");
          final int _cursorIndexOfCompleted = CursorUtil.getColumnIndexOrThrow(_cursor, "completed");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final TodoEntity _result;
          if (_cursor.moveToFirst()) {
            final long _tmpId;
            _tmpId = _cursor.getLong(_cursorIndexOfId);
            final String _tmpTitle;
            _tmpTitle = _cursor.getString(_cursorIndexOfTitle);
            final String _tmpPriority;
            _tmpPriority = _cursor.getString(_cursorIndexOfPriority);
            final Long _tmpDueDate;
            if (_cursor.isNull(_cursorIndexOfDueDate)) {
              _tmpDueDate = null;
            } else {
              _tmpDueDate = _cursor.getLong(_cursorIndexOfDueDate);
            }
            final String _tmpRecurrence;
            _tmpRecurrence = _cursor.getString(_cursorIndexOfRecurrence);
            final boolean _tmpCompleted;
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfCompleted);
            _tmpCompleted = _tmp != 0;
            final long _tmpCreatedAt;
            _tmpCreatedAt = _cursor.getLong(_cursorIndexOfCreatedAt);
            _result = new TodoEntity(_tmpId,_tmpTitle,_tmpPriority,_tmpDueDate,_tmpRecurrence,_tmpCompleted,_tmpCreatedAt);
          } else {
            _result = null;
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @NonNull
  public static List<Class<?>> getRequiredConverters() {
    return Collections.emptyList();
  }
}
