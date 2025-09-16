import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <section className="flex flex-col items-center text-center gap-5 py-12 px-4 min-h-[calc(100vh-16rem)] justify-center w-full">
      <div className="space-y-3 max-w-xl">
        <h1 className="text-3xl sm:text-4xl font-semibold leading-tight">Snack smarter, right on time</h1>
        <p className="text-slate-700">
          Take a quick one-time quiz to get snack timing and suggestions tailored to your meal times and preferences.
        </p>
      </div>
      <Link to="/quiz" className="btn-banana px-6 py-3 rounded-md text-base font-medium shadow-sm">
        Start the quiz
      </Link>
    </section>
  )
}
