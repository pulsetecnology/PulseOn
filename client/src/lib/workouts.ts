import { Exercise, Workout } from "@shared/schema";

export const sampleExercises: Exercise[] = [
  {
    id: "1",
    name: "Agachamento Livre",
    sets: 3,
    reps: 12,
    suggestedWeight: 40,
    restTime: 90,
    instructions: "Mantenha os pés afastados na largura dos ombros, desça até os joelhos formarem 90 graus",
    muscleGroups: ["quadriceps", "glúteos", "core"]
  },
  {
    id: "2",
    name: "Leg Press",
    sets: 3,
    reps: 15,
    suggestedWeight: 80,
    restTime: 75,
    instructions: "Posicione os pés na plataforma, desça controladamente até formar 90 graus",
    muscleGroups: ["quadriceps", "glúteos"]
  },
  {
    id: "3",
    name: "Cadeira Extensora",
    sets: 3,
    reps: 12,
    suggestedWeight: 25,
    restTime: 60,
    instructions: "Sente-se corretamente, estenda as pernas controladamente",
    muscleGroups: ["quadriceps"]
  },
  {
    id: "4",
    name: "Mesa Flexora",
    sets: 3,
    reps: 12,
    suggestedWeight: 20,
    restTime: 60,
    instructions: "Deite-se de bruços, flexione as pernas trazendo os calcanhares em direção aos glúteos",
    muscleGroups: ["isquiotibiais"]
  },
  {
    id: "5",
    name: "Panturrilha em Pé",
    sets: 4,
    reps: 15,
    suggestedWeight: 30,
    restTime: 45,
    instructions: "Suba na ponta dos pés, contraia bem a panturrilha no topo do movimento",
    muscleGroups: ["panturrilhas"]
  }
];

export const sampleWorkouts: Omit<Workout, "id" | "userId" | "createdAt" | "completedAt">[] = [
  {
    name: "Treino de Pernas",
    description: "Treino focado em quadriceps, glúteos e panturrilhas",
    duration: 45,
    difficulty: "intermediate",
    exercises: sampleExercises
  },
  {
    name: "Treino de Peito",
    description: "Treino completo para peitoral maior e menor",
    duration: 40,
    difficulty: "intermediate",
    exercises: [
      {
        id: "6",
        name: "Supino Reto",
        sets: 4,
        reps: 10,
        suggestedWeight: 60,
        restTime: 120,
        instructions: "Deite-se no banco, abaixe a barra até o peito e empurre para cima",
        muscleGroups: ["peitoral", "tríceps", "deltoides"]
      },
      {
        id: "7",
        name: "Supino Inclinado",
        sets: 3,
        reps: 12,
        suggestedWeight: 50,
        restTime: 90,
        instructions: "No banco inclinado, realize o movimento similar ao supino reto",
        muscleGroups: ["peitoral superior", "deltoides"]
      }
    ]
  },
  {
    name: "Treino de Costas",
    description: "Treino completo para latíssimo e romboides",
    duration: 50,
    difficulty: "intermediate",
    exercises: [
      {
        id: "8",
        name: "Puxada Frontal",
        sets: 4,
        reps: 12,
        suggestedWeight: 45,
        restTime: 90,
        instructions: "Puxe a barra em direção ao peito, contraia bem as costas",
        muscleGroups: ["latíssimo", "romboides", "bíceps"]
      }
    ]
  }
];
