import trainerQuestionBank from "../trainer/trainer-question-bank.json";

export const dynamic = "force-static";

export function GET() {
  return Response.json(trainerQuestionBank, {
    headers: {
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
