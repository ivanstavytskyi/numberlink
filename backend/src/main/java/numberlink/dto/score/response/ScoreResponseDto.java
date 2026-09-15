package numberlink.dto.score.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ScoreResponseDto {
    private String player;
    private String avatarUrl;
    private int elapsedSeconds;
    private int fieldWidth;
    private int fieldHeight;
    private double avgElapsedSeconds;
    private double avgScore;
    private int points;
    private int hints;

    public ScoreResponseDto(
            String player,
            String avatarUrl,
            int elapsedSeconds,
            int fieldWidth,
            int fieldHeight,
            double avgElapsedSeconds,
            double avgScore,
            int points,
            int hints
    ) {
        this.player = player;
        this.avatarUrl = avatarUrl;
        this.elapsedSeconds = elapsedSeconds;
        this.fieldWidth = fieldWidth;
        this.fieldHeight = fieldHeight;
        this.avgElapsedSeconds = avgElapsedSeconds;
        this.avgScore = avgScore;
        this.points = points;
        this.hints = hints;
    }
}
