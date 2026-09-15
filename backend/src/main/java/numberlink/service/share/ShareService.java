package numberlink.service.share;

import numberlink.dto.share.resposnse.ShareResultDto;
import numberlink.dto.share.resposnse.ShareTokenDto;
import numberlink.entity.ScoreEntity;
import numberlink.entity.ShareResultsEntity;
import numberlink.entity.UserEntity;
import numberlink.exceptions.*;
import numberlink.repository.ScoreRepository;
import numberlink.repository.ShareResultsRepository;
import numberlink.service.auth.AuthService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class ShareService {

    private final ScoreRepository scoreRepository;
    private final ShareResultsRepository shareResultsRepository;
    private final AuthService authService;

    public ShareService(
            ScoreRepository scoreRepository,
            ShareResultsRepository shareResultsRepository,
            AuthService authService
    ) {
        this.scoreRepository = scoreRepository;
        this.shareResultsRepository = shareResultsRepository;
        this.authService = authService;
    }

    public ShareTokenDto generateShareToken(String rawGameToken) {
        UUID gameToken = parseToken(rawGameToken);

        UserEntity viewer = authService.findCurrentUser().orElse(null);
        if (viewer == null) {
            throw new ShareTokenForbiddenException();
        }

        Optional<ShareResultsEntity> existing = shareResultsRepository.findByGameToken(gameToken);
        if (existing.isPresent()) {
            return new ShareTokenDto(existing.get().getShareToken());
        }

        ScoreEntity privateScore = scoreRepository.findByGameToken(gameToken)
                .orElseThrow(ShareResultNotFoundException::new);

        if (privateScore.getUser() == null || !viewer.getId().equals(privateScore.getUser().getId())) {
            throw new ShareTokenForbiddenException();
        }


        UUID shareToken =  UUID.randomUUID();
        ShareResultsEntity share = new ShareResultsEntity();
        share.setShareToken(shareToken);
        share.setGameId(privateScore);
        share.setCreatedAt(Instant.now());

        shareResultsRepository.save(share);
        return new ShareTokenDto(share.getShareToken());
    }

    public void revokeShareToken(String rawGameToken) {
        UUID gameToken = parseToken(rawGameToken);

        UserEntity viewer = authService.findCurrentUser().orElse(null);
        if (viewer == null) {
            throw new ShareTokenForbiddenException();
        }

        ShareResultsEntity share = shareResultsRepository.findByGameToken(gameToken)
                .orElseThrow(ShareResultNotFoundException::new);

        shareResultsRepository.delete(share);
    }

    @Transactional(readOnly = true)
    public ShareResultDto findSharedResult(String rawToken) {
        UUID token = parseToken(rawToken);

        Optional<ShareResultsEntity> shared = shareResultsRepository.findByShareToken(token);
        if (shared.isEmpty()) {
            shared = shareResultsRepository.findByGameToken(token);
        }
        if (shared.isPresent()) {
            ScoreEntity score = shared.get().getGameId();
            if (score == null) {
                throw new ShareResultNotFoundException();
            }
            return toDto(score, "public", shared.get().getShareToken());
        }

        ScoreEntity privateScore = scoreRepository.findByGameToken(token)
                .orElseThrow(ShareResultNotFoundException::new);
        UserEntity viewer = authService.findCurrentUser().orElse(null);
        if (viewer == null || privateScore.getUser() == null
                || !viewer.getId().equals(privateScore.getUser().getId())) {
            throw new ShareAccessDeniedException();
        }
        return toDto(privateScore, "private", null);
    }

    private UUID parseToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new ShareResultNotFoundException();
        }
        try {
            return UUID.fromString(rawToken.trim());
        } catch (IllegalArgumentException ex) {
            throw new ShareResultNotFoundException();
        }
    }

    private ShareResultDto toDto(ScoreEntity score, String access, UUID shareToken) {
        UserEntity owner = score.getUser();
        String player = owner != null && owner.getUsername() != null
                ? owner.getUsername()
                : "A NumberLink player";
        return new ShareResultDto(
                player,
                score.getScoreResult(),
                score.getElapsedSeconds(),
                score.getFieldWidth(),
                score.getFieldHeight(),
                score.getHints(),
                access,
                shareToken
        );
    }
}
