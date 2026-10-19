import ListingForm from '@/components/admin/ListingForm'

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ListingForm id={id === 'new' ? undefined : id} />
}
