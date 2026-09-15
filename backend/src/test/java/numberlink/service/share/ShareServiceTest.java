package numberlink.service.share;

import numberlink.dto.share.resposnse.ShareResultDto;
import numberlink.entity.ScoreEntity;
import numberlink.entity.ShareResultsEntity;
import numberlink.entity.UserEntity;
import numberlink.exceptions.ShareAccessDeniedException;
import numberlink.exceptions.ShareResultNotFoundException;
import numberlink.repository.ScoreRepository;
import numberlink.repository.ShareResultsRepository;
import numberlink.service.auth.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ShareServiceTest {

    @Mock private ScoreRepository scoreRepository;
    @Mock private ShareResultsRepository shareResultsRepository;
    @Mock private AuthService authService;

    private ShareService shareService;

    @BeforeEach
    void setUp() {
        shareService = new ShareService(scoreRepository, shareResultsRepository, authService);
    }

    @Test
    void privateToken_ownerSeesResult() {
        UUID token = UUID.fromString("42dad145-f830-440f-a00e-5706902a7f14");
        UserEntity owner = user("owner");
        ScoreEntity score = score(owner, 556, 18, 7, 0);
        when(shareResultsRepository.findByShareToken(token)).thenReturn(Optional.empty());
        when(shareResultsRepository.findByGameToken(token)).thenReturn(Optional.empty());
        when(scoreRepository.findByGameToken(token)).thenReturn(Optional.of(score));
        when(authService.findCurrentUser()).thenReturn(Optional.of(owner));

        ShareResultDto dto = shareService.findSharedResult(token.toString());

        assertEquals("owner", dto.getPlayer());
        assertEquals(556, dto.getPoints());
        assertEquals(18, dto.getElapsedSeconds());
        assertEquals(7, dto.getFieldWidth());
        assertEquals("private", dto.getAccess());
    }

    @Test
    void privateToken_guestIsDenied() {
        UUID token = UUID.randomUUID();
        when(shareResultsRepository.findByShareToken(token)).thenReturn(Optional.empty());
        when(shareResultsRepository.findByGameToken(token)).thenReturn(Optional.empty());
        when(scoreRepository.findByGameToken(token)).thenReturn(Optional.of(score(user("owner"), 100, 10, 7, 0)));
        when(authService.findCurrentUser()).thenReturn(Optional.empty());

        assertThrows(ShareAccessDeniedException.class, () -> shareService.findSharedResult(token.toString()));
    }

    @Test
    void privateToken_otherUserIsDenied() {
        UUID token = UUID.randomUUID();
        when(shareResultsRepository.findByShareToken(token)).thenReturn(Optional.empty());
        when(shareResultsRepository.findByGameToken(token)).thenReturn(Optional.empty());
        when(scoreRepository.findByGameToken(token)).thenReturn(Optional.of(score(user("owner"), 100, 10, 7, 0)));
        when(authService.findCurrentUser()).thenReturn(Optional.of(user("other")));

        assertThrows(ShareAccessDeniedException.class, () -> shareService.findSharedResult(token.toString()));
    }

    @Test
    void publicToken_anyoneSeesResult() {
        UUID token = UUID.randomUUID();
        ScoreEntity score = score(user("alice"), 800, 12, 8, 1);
        ShareResultsEntity shared = new ShareResultsEntity();
        shared.setShareToken(token);
        shared.setGameId(score);
        when(shareResultsRepository.findByShareToken(token)).thenReturn(Optional.of(shared));

        ShareResultDto dto = shareService.findSharedResult(token.toString());

        assertEquals("alice", dto.getPlayer());
        assertEquals(800, dto.getPoints());
        assertEquals("public", dto.getAccess());
    }

    @Test
    void unknownToken_notFound() {
        UUID token = UUID.randomUUID();
        when(shareResultsRepository.findByShareToken(token)).thenReturn(Optional.empty());
        when(shareResultsRepository.findByGameToken(token)).thenReturn(Optional.empty());
        when(scoreRepository.findByGameToken(token)).thenReturn(Optional.empty());

        assertThrows(ShareResultNotFoundException.class, () -> shareService.findSharedResult(token.toString()));
    }

    @Test
    void invalidToken_notFound() {
        assertThrows(ShareResultNotFoundException.class, () -> shareService.findSharedResult("not-a-uuid"));
    }

    private static UserEntity user(String name) {
        UserEntity user = new UserEntity();
        user.setId(UUID.randomUUID());
        user.setUsername(name);
        return user;
    }

    private static ScoreEntity score(UserEntity owner, int points, int seconds, int size, int hints) {
        ScoreEntity score = new ScoreEntity();
        score.setUser(owner);
        score.setScoreResult(points);
        score.setElapsedSeconds(seconds);
        score.setFieldWidth(size);
        score.setFieldHeight(size);
        score.setHints(hints);
        return score;
    }
}
