from api.models import TestInvite, Test
from django.db.models import Q

def fix_invites():
    n = 0
    for invite in TestInvite.objects.filter(test__isnull=True):
        tests = Test.objects.filter(
            Q(name__iexact=invite.title) |
            Q(name__icontains=invite.title) |
            Q(name__icontains=invite.title.strip()) |
            Q(name__istartswith=invite.title[:8])
        )
        if invite.subject:
            tests = tests.filter(
                Q(subject__iexact=invite.subject) |
                Q(subject__icontains=invite.subject)
            )
        test = tests.first()
        if test:
            invite.test = test
            invite.save()
            print(f'Invite {invite.id} linked to test {test.id}')
            n += 1
    print(f'Updated {n} invites with test_id.')

if __name__ == '__main__':
    fix_invites() 