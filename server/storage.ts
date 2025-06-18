export * from "./storage-postgres";

async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | null> {
    try {
      console.log("Updating user", id, "with data:", updates);

      const updateFields = [];
      const values = [];

      // Build dynamic update query
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          updateFields.push(`${key} = ?`);
          values.push(typeof value === 'object' ? JSON.stringify(value) : value);
        }
      }

      if (updateFields.length === 0) {
        return this.getUser(id);
      }

      const query = `
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;

      values.push(id);

      console.log("Executing query:", query);
      console.log("With values:", values);

      const updateResult = this.db.prepare(query).run(...values);
      console.log("Update result:", updateResult);

      if (updateResult.changes === 0) {
        return null;
      }

      return this.getUser(id);
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

async createWorkoutSession(sessionData: InsertWorkoutSession): Promise<WorkoutSession> {
    try {
      console.log("Creating workout session with data:", JSON.stringify(sessionData, null, 2));

      const insert = this.db.prepare(`
        INSERT INTO workout_sessions (user_id, workout_id, started_at, completed_at, exercises, total_duration, total_calories, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // Ensure dates are properly formatted
      const startedAt = sessionData.startedAt 
        ? (typeof sessionData.startedAt === 'string' ? sessionData.startedAt : sessionData.startedAt.toISOString())
        : new Date().toISOString();

      const completedAt = sessionData.completedAt 
        ? (typeof sessionData.completedAt === 'string' ? sessionData.completedAt : sessionData.completedAt.toISOString())
        : null;

      const result = insert.run(
        sessionData.userId,
        sessionData.workoutId || null,
        startedAt,
        completedAt,
        JSON.stringify(sessionData.exercises || []),
        sessionData.totalDuration || 0,
        sessionData.totalCalories || 0,
        sessionData.notes || null
      );

      console.log("Workout session created with ID:", result.lastInsertRowid);

      return this.getWorkoutSession(Number(result.lastInsertRowid));
    } catch (error) {
      console.error("Error creating workout session:", error);
      throw error;
    }
  }