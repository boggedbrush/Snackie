import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Snack smarter, right on time</h1>
      <p className="text-slate-700 max-w-prose">
        Take a quick one-time quiz to get snack timing and suggestions tailored to your meal times and preferences.
      </p>
      <Link to="/quiz" className="inline-block btn-banana px-4 py-2 rounded-md">
        Start the quiz
      </Link>
    </section>
  )
}
