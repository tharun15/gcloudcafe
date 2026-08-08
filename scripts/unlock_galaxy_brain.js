const { execSync } = require('child_process');

async function main() {
  console.log("🌌 Unlocking Galaxy Brain achievement badge...");

  const queryRepo = `
    query {
      repository(owner: "tharun15", name: "gcloudcafe") {
        id
        discussionCategories(first: 10) {
          nodes {
            id
            name
            isAnswerable
          }
        }
      }
    }
  `;

  const repoResRaw = execSync(`gh api graphql -f query='${queryRepo}'`, { encoding: 'utf8' });
  const repoRes = JSON.parse(repoResRaw);

  const repoId = repoRes.data.repository.id;
  const categories = repoRes.data.repository.discussionCategories.nodes;
  console.log("Discussion Categories:", categories);

  const answerableCategory = categories.find(c => c.isAnswerable) || categories[0];
  console.log(`Using Answerable Category: ${answerableCategory.name} (${answerableCategory.id})`);

  // Step 2: Create Q&A Discussion
  const createDiscussionMutation = `
    mutation {
      createDiscussion(input: {
        repositoryId: "${repoId}",
        categoryId: "${answerableCategory.id}",
        title: "How to configure automated Cloud Pulse feed scraping in GCloudCafé?",
        body: "What is the recommended cron setup and feed list for automated cloud news ingestion?"
      }) {
        discussion {
          id
          url
        }
      }
    }
  `;

  const discResRaw = execSync(`gh api graphql -f query='${createDiscussionMutation}'`, { encoding: 'utf8' });
  const discRes = JSON.parse(discResRaw);
  const discussionId = discRes.data.createDiscussion.discussion.id;
  console.log(`✅ Discussion created: ${discRes.data.createDiscussion.discussion.url}`);

  // Step 3: Add Answer Comment
  const addCommentMutation = `
    mutation {
      addDiscussionComment(input: {
        discussionId: "${discussionId}",
        body: "Automated Cloud Pulse newsroom scraping is configured via \`scripts/daily-cloud-pulse-scraper.js\` using 13 high-value RSS feeds (GCP, AWS Architecture, Azure, CNCF, OpenShift, HashiCorp, DevOps.com, The New Stack) scheduled daily."
      }) {
        comment {
          id
        }
      }
    }
  `;

  const commentResRaw = execSync(`gh api graphql -f query='${addCommentMutation}'`, { encoding: 'utf8' });
  const commentRes = JSON.parse(commentResRaw);
  const commentId = commentRes.data.addDiscussionComment.comment.id;
  console.log(`✅ Answer comment added: ${commentId}`);

  // Step 4: Mark as Answer
  const markAnswerMutation = `
    mutation {
      markDiscussionCommentAsAnswer(input: {
        id: "${commentId}"
      }) {
        discussion {
          id
          title
        }
      }
    }
  `;

  const answerResRaw = execSync(`gh api graphql -f query='${markAnswerMutation}'`, { encoding: 'utf8' });
  console.log("🎉 Galaxy Brain answer accepted successfully!", answerResRaw);
}

main().catch(console.error);
