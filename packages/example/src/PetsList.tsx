import { useListPets } from '../generated/reactQuery'
import { Components, Paths } from '../generated/typeDefinitions'

type Pet = Components.Schemas.Pet

const fakePet: Pet = {
  id: 1,
  name: 'Paul',
  tag: 'happy',
}

const getPetNames = (response: Paths.ListPets.Responses.$200): string[] => {
  return response.map((pet) => pet.name)
}

const PetsList = () => {
  const { data, isLoading } = useListPets({
    pathParams: {
      owner: 'John',
    },
    queryParams: {},
  })

  if (isLoading || !data) {
    return <span>Loading...</span>
  }

  const petNames = getPetNames(data)

  return (
    <div>
      <section>
        <h1>Pets</h1>

        <h2>My fake pet</h2>
        <pre>{JSON.stringify(fakePet, null, 2)}</pre>
      </section>

      <ul>
        {petNames.map((name, index) => (
          <li key={index}>{name}</li>
        ))}
      </ul>
    </div>
  )
}

export default PetsList
