package numberlink.controller;

import numberlink.entity.RatingEntity;
import numberlink.entity.UserEntity;
import numberlink.exceptions.RestExceptionHandler;
import numberlink.repository.RatingRepository;
import numberlink.service.auth.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class RatingServiceRestTest {

    @Mock private RatingRepository ratingRepository;
    @Mock private AuthService authService;

    @InjectMocks private RatingServiceRest ratingServiceRest;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mockMvc = MockMvcBuilders
                .standaloneSetup(ratingServiceRest)
                .setControllerAdvice(new RestExceptionHandler())
                .setValidator(validator)
                .build();
    }

    @Test
    void postRating_whenCommentBlank_returns400() throws Exception {
        mockMvc.perform(post("/api/rating")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"rating":5,"comment":"   "}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("must not be blank"));
    }

    @Test
    void postRating_whenRatingOutOfRange_returns400() throws Exception {
        mockMvc.perform(post("/api/rating")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"rating":0,"comment":"nice game"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("must be greater than or equal to 1"));
    }

    @Test
    void postRating_whenRatingMissing_returns400() throws Exception {
        mockMvc.perform(post("/api/rating")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"comment":"nice game"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("must not be null"));
    }

    @Test
    void postRating_whenValid_savesRatingAndComment() throws Exception {
        UserEntity user = new UserEntity();
        user.setId(UUID.randomUUID());
        when(authService.requireCurrentUser()).thenReturn(user);
        when(ratingRepository.findByUser_Id(user.getId())).thenReturn(Optional.empty());
        when(ratingRepository.save(any(RatingEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(post("/api/rating")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"rating":5,"comment":"nice game"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.value").value(5));

        ArgumentCaptor<RatingEntity> saved = ArgumentCaptor.forClass(RatingEntity.class);
        verify(ratingRepository).save(saved.capture());
        assertEquals(user, saved.getValue().getUser());
        assertEquals(5, saved.getValue().getValue());
        assertEquals("nice game", saved.getValue().getContent());
        assertNotNull(saved.getValue().getRatedAt());
        assertNotNull(saved.getValue().getCommentedOn());
    }

    @Test
    void getRating_returnsCurrentUserValueAndComment() throws Exception {
        UserEntity user = new UserEntity();
        user.setId(UUID.randomUUID());
        RatingEntity rating = new RatingEntity();
        rating.setUser(user);
        rating.setValue(4);
        rating.setContent("solid puzzle");
        when(authService.requireCurrentUser()).thenReturn(user);
        when(ratingRepository.findByUser_Id(user.getId())).thenReturn(Optional.of(rating));

        mockMvc.perform(get("/api/rating"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.value").value(4))
                .andExpect(jsonPath("$.comment").value("solid puzzle"));
    }

    @Test
    void getComments_returnsReviewsWithText() throws Exception {
        UserEntity author = new UserEntity();
        author.setUsername("player");
        author.setAvatarUrl("/uploads/p.png");
        RatingEntity review = new RatingEntity();
        review.setUser(author);
        review.setValue(5);
        review.setContent("great maps");
        review.setCommentedOn(Instant.parse("2026-09-18T12:00:00Z"));
        when(ratingRepository.findAllWithComments()).thenReturn(List.of(review));

        mockMvc.perform(get("/api/rating/comments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].player").value("player"))
                .andExpect(jsonPath("$[0].avatarUrl").value("/uploads/p.png"))
                .andExpect(jsonPath("$[0].rating").value(5))
                .andExpect(jsonPath("$[0].comment").value("great maps"))
                .andExpect(jsonPath("$[0].commentedOn").value("2026-09-18T12:00:00Z"));
    }
}
