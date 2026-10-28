import ProjectorOutput from '@/components/tools/projection-mapper/ProjectorOutput'

export const metadata = {
  title: 'Projector Output - Jorge Romero',
  robots: { index: false },
}

export default async function ProjectorOutputPage({ searchParams }: { searchParams: Promise<{ room?: string }> }) {
  const { room } = await searchParams
  return <ProjectorOutput initialRoom={room ?? null} />
}
