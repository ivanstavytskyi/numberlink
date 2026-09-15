package numberlink.dto.score.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ScoreHistoryDto {
    private Long id;
    private UUID gameToken;
    private int elapsedSeconds;
    private int fieldWidth;
    private int fieldHeight;
    private int points;
    private int hints;
    private Instant playedAt;
}
