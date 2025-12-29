-- Allow parents to view their children's assignment submissions
-- Parents need this to see grades and submission status for their children

CREATE POLICY "Parents can view children submissions"
ON assignment_submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM parent_child_links
    WHERE parent_child_links.parent_id = auth.uid()
    AND parent_child_links.child_id = assignment_submissions.student_id
  )
);
