export async function handler(event) {
  console.log('event:', JSON.stringify(event))

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello, World!',
      input: event,
    }, null, 2)
  }

  return response
}
