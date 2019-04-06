const { Toolkit } = require('actions-toolkit')
const nock = require('nock')

const events = [
  {
    type: 'IssuesEvent',
    repo: { name: 'clippy/take-over-github' },
    payload: { action: 'opened', issue: { number: 1 } }
  },
  {
    type: 'IssueCommentEvent',
    repo: { name: 'clippy/take-over-github' },
    payload: { action: 'closed', issue: { number: 1 } }
  },
  {
    type: 'PullRequestEvent',
    repo: { name: 'clippy/take-over-github' },
    payload: { action: 'closed', pull_request: { number: 2, merged: true } }
  },
  {
    type: 'PullRequestEvent',
    repo: { name: 'clippy/take-over-github' },
    payload: { action: 'closed', pull_request: { number: 3, merged: false } }
  },
  {
    type: 'PullRequestEvent',
    repo: { name: 'clippy/really-really-really-long' },
    payload: { action: 'opened', pull_request: { number: 3 } }
  }
]

describe('activity-box', () => {
  let action, tools, updatedGist

  beforeEach(() => {
    Toolkit.run = fn => {
      action = fn
    }
    require('..')

    nock('https://api.github.com')
      // Get the user's recent activity
      .get('/users/clippy/events/public?per_page=100')
      .reply(200, events)
      // Get the Gist
      .get('/gists/456def')
      .reply(200, { description: 'a gist', files: { 'a file': {} } })
      // Update the Gist
      .patch('/gists/456def')
      .reply(200, (_, body) => {
        updatedGist = JSON.parse(body)
      })

    tools = new Toolkit({
      logger: {
        info: jest.fn(),
        success: jest.fn(),
        warn: jest.fn(),
        fatal: jest.fn()
      }
    })

    tools.exit = {
      success: jest.fn(),
      failure: jest.fn()
    }
  })

  it('updates the Gist with the expected string', async () => {
    await action(tools)
    expect(updatedGist).toMatchSnapshot()
  })

  // describe('createBody', () => {
  //   it('returns the expected string', async () => {
  //     const actual = await createBody()
  //     expect(actual).toMatchSnapshot()
  //   })
  // })

  // describe('updateGist', () => {
  //   beforeEach(() => {
  //     console.log = jest.fn()
  //     console.error = jest.fn()
  //   })

  //   it('handles a missing Gist', async () => {
  //     nock.cleanAll()
  //     const nocked = nock('https://api.github.com')
  //       .get('/gists/456def').reply(404)
  //       .patch('/gists/456def').reply(200)

  //     await updateGist('hello')
  //     expect(console.error).toHaveBeenCalled()
  //     expect(nocked.pendingMocks()).toEqual([
  //       'PATCH https://api.github.com:443/gists/456def'
  //     ])
  //   })

  //   it('handles failure to update the Gist', async () => {
  //     nock.cleanAll()
  //     nock('https://api.github.com')
  //       .get('/gists/456def')
  //       .reply(200, { description: 'a gist', files: ['a file'] })
  //       .patch('/gists/456def')
  //       .reply(404)

  //     await updateGist('hello')
  //     expect(console.error).toHaveBeenCalled()
  //   })
  // })
})
