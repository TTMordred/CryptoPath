
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (address) {
      router.push(`/?address=${address}`)
    }
  }

  return (
    <form onSubmit={handleSearch} className="flex gap-2">

      <Button type="submit">Search</Button>
    </form>
  )
}

